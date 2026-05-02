import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single() as any;
  if (!profile) redirect('/login');

  // Count of DM messages addressed to this user that they have not read yet.
  // RLS already restricts dm_messages to threads where the user is a
  // participant, so neq('sender_id', me) gets exactly the inbound unread.
  const { count: unreadDms } = await supabase
    .from('dm_messages')
    .select('*', { count: 'exact', head: true })
    .neq('sender_id', user.id)
    .is('read_at', null);

  return (
    <AppShell profile={profile} unreadDms={unreadDms ?? 0}>
      {children}
    </AppShell>
  );
}
