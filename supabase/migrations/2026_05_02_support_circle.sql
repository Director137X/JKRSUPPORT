-- =============================================================================
-- JK&R PORTAL — Support Circle + Direct Messages + Identity Reveal
-- =============================================================================
-- Apply via:  supabase db push
-- Or paste into the Supabase SQL editor.
--
-- Adds:
--   • circle_messages         — group-chat thread (anonymous-capable)
--   • dm_threads              — pairwise rep<->admin direct messages
--   • dm_messages             — messages inside a thread
--   • RLS policies            — closers/setters/admins/superadmin scopes
--   • identity_reveal_log     — audit row every time a superadmin unmasks
-- =============================================================================

-- ============================================================================
-- 1. SUPPORT CIRCLE — group chat
-- ============================================================================
create table if not exists public.circle_messages (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references auth.users(id) on delete cascade,
  is_anonymous    boolean not null default false,
  body            text not null check (length(body) between 1 and 4000),
  reply_to        uuid references public.circle_messages(id) on delete set null,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz
);
create index if not exists circle_messages_created_at_idx on public.circle_messages (created_at desc);
create index if not exists circle_messages_author_idx     on public.circle_messages (author_id);

alter table public.circle_messages enable row level security;

-- READ: any authenticated user reads non-deleted Circle messages.
-- Anonymous flag hides author client-side; identity is masked in views below.
drop policy if exists circle_read on public.circle_messages;
create policy circle_read on public.circle_messages
  for select to authenticated
  using (deleted_at is null);

-- INSERT: authenticated users post as themselves.
drop policy if exists circle_insert on public.circle_messages;
create policy circle_insert on public.circle_messages
  for insert to authenticated
  with check (author_id = auth.uid());

-- UPDATE: author can edit their own message; admins can soft-delete any.
drop policy if exists circle_update_own on public.circle_messages;
create policy circle_update_own on public.circle_messages
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists circle_admin_delete on public.circle_messages;
create policy circle_admin_delete on public.circle_messages
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','superadmin')
    )
  );

-- ============================================================================
-- 2. DIRECT MESSAGES — pairwise threads
-- ============================================================================
create table if not exists public.dm_threads (
  id              uuid primary key default gen_random_uuid(),
  rep_id          uuid not null references auth.users(id) on delete cascade,
  admin_id        uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (rep_id, admin_id)
);
create index if not exists dm_threads_rep_idx   on public.dm_threads (rep_id, last_message_at desc);
create index if not exists dm_threads_admin_idx on public.dm_threads (admin_id, last_message_at desc);

alter table public.dm_threads enable row level security;

-- A thread is visible to its two participants and to superadmin (oversight).
drop policy if exists dm_threads_read on public.dm_threads;
create policy dm_threads_read on public.dm_threads
  for select to authenticated
  using (
    auth.uid() = rep_id
    or auth.uid() = admin_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
  );

-- A thread is created by either side; admin must actually be admin/superadmin.
drop policy if exists dm_threads_insert on public.dm_threads;
create policy dm_threads_insert on public.dm_threads
  for insert to authenticated
  with check (
    (auth.uid() = rep_id or auth.uid() = admin_id)
    and exists (
      select 1 from public.profiles p where p.id = admin_id and p.role in ('admin','superadmin')
    )
  );

create table if not exists public.dm_messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.dm_threads(id) on delete cascade,
  sender_id       uuid not null references auth.users(id) on delete cascade,
  body            text not null check (length(body) between 1 and 4000),
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);
create index if not exists dm_messages_thread_idx on public.dm_messages (thread_id, created_at);

alter table public.dm_messages enable row level security;

-- Read DMs only if you're a participant of the thread (or superadmin).
drop policy if exists dm_messages_read on public.dm_messages;
create policy dm_messages_read on public.dm_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.dm_threads t
      where t.id = thread_id
        and (
          auth.uid() = t.rep_id
          or auth.uid() = t.admin_id
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
        )
    )
  );

-- Send DMs only if you're a participant.
drop policy if exists dm_messages_insert on public.dm_messages;
create policy dm_messages_insert on public.dm_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.dm_threads t
      where t.id = thread_id and (auth.uid() = t.rep_id or auth.uid() = t.admin_id)
    )
  );

-- Bump thread.last_message_at on every send.
create or replace function public.dm_thread_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.dm_threads set last_message_at = now() where id = new.thread_id;
  return new;
end $$;

drop trigger if exists dm_thread_touch_trg on public.dm_messages;
create trigger dm_thread_touch_trg
  after insert on public.dm_messages
  for each row execute function public.dm_thread_touch();

-- ============================================================================
-- 3. IDENTITY REVEAL AUDIT — every superadmin peek is logged
-- ============================================================================
create table if not exists public.identity_reveal_log (
  id            uuid primary key default gen_random_uuid(),
  superadmin_id uuid not null references auth.users(id) on delete cascade,
  target_id     uuid not null references auth.users(id) on delete cascade,
  reason        text,
  context       text, -- e.g. 'oversight', 'circle:msg-uuid', 'admin-conversations'
  created_at    timestamptz not null default now()
);
create index if not exists identity_reveal_log_super_idx on public.identity_reveal_log (superadmin_id, created_at desc);

alter table public.identity_reveal_log enable row level security;
drop policy if exists irl_super_only on public.identity_reveal_log;
create policy irl_super_only on public.identity_reveal_log
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- ============================================================================
-- 4. VIEWS — masked circle feed for non-superadmins
-- ============================================================================
create or replace view public.circle_feed as
select
  m.id,
  case when m.is_anonymous then null else p.name end           as author_name,
  case when m.is_anonymous then null else p.email end          as author_email,
  case when m.is_anonymous then 'Anonymous Rep' else p.name end as display_name,
  p.role                                                        as author_role,
  m.body,
  m.reply_to,
  m.created_at,
  m.edited_at
from public.circle_messages m
join public.profiles p on p.id = m.author_id
where m.deleted_at is null;

-- Superadmin-only view that always reveals identity (call from a server route
-- that has already verified the caller is superadmin, then INSERT into
-- identity_reveal_log so every peek is recorded).
create or replace view public.circle_feed_unmasked as
select
  m.id,
  p.id           as author_id,
  p.name         as author_name,
  p.email        as author_email,
  p.role         as author_role,
  m.is_anonymous as posted_anonymously,
  m.body,
  m.reply_to,
  m.created_at,
  m.edited_at
from public.circle_messages m
join public.profiles p on p.id = m.author_id
where m.deleted_at is null;

-- ============================================================================
-- 5. REALTIME — enable for the chat tables
-- ============================================================================
-- After running, also turn on Realtime in Supabase Dashboard → Database →
-- Replication for `circle_messages` and `dm_messages`. The publication add
-- is idempotent.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'circle_messages'
  ) then
    alter publication supabase_realtime add table public.circle_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'dm_messages'
  ) then
    alter publication supabase_realtime add table public.dm_messages;
  end if;
end $$;
