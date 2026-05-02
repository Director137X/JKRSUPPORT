import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { EyeIcon } from '@/components/eye-icon';
import { GrantForm } from './grant-form';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) redirect('/coach');
  const isSuper = me.role === 'superadmin';

  const [{ count: userCount }, { count: convoCount }, { count: msgsToday }, { data: convos }, { data: users }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('admin_conversations').select('*').order('updated_at', { ascending: false }).limit(50),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
  ]);

  return (
    <div className="h-full overflow-y-auto px-8 py-10 scrollbar-thin">
      <div className="max-w-6xl mx-auto space-y-10">
        <header>
          <h1 className="font-display text-2xl tracking-wide text-white flex items-center gap-2">
            Admin Dashboard <EyeIcon size={20} className="text-gold" />
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isSuper ? 'Superadmin view — full identities visible.' : 'Admin view — anonymous reps masked.'}
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Total reps" value={userCount ?? 0} />
          <Stat label="Total conversations" value={convoCount ?? 0} />
          <Stat label="Messages today" value={msgsToday ?? 0} />
        </section>

        {isSuper && <GrantForm />}

        <section>
          <h2 className="font-display text-sm tracking-widest uppercase text-gold mb-4">Recent conversations</h2>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-zinc-400 text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left px-4 py-3">Rep</th>
                  <th className="text-left px-4 py-3">Title / first message</th>
                  <th className="text-left px-4 py-3">Msgs</th>
                  <th className="text-left px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {(convos ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-line hover:bg-surface-2/50">
                    <td className="px-4 py-3 text-white">
                      {c.user_is_anonymous && !isSuper ? 'Anonymous Rep' : c.user_name || c.user_email}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 truncate max-w-md">
                      {c.title}
                      {c.first_user_message && (
                        <div className="text-xs text-zinc-500 truncate">{c.first_user_message}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{c.message_count}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(c.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!convos || convos.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center text-zinc-500 py-8">No conversations yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-sm tracking-widest uppercase text-gold mb-4">All users</h2>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-zinc-400 text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr key={u.id} className="border-t border-line hover:bg-surface-2/50">
                    <td className="px-4 py-3 text-white">
                      {u.is_anonymous && !isSuper ? 'Anonymous Rep' : u.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{isSuper ? u.email : '—'}</td>
                    <td className="px-4 py-3 text-gold capitalize flex items-center gap-1.5">
                      {u.role}
                      {(u.role === 'admin' || u.role === 'superadmin') && <EyeIcon size={12} className="text-gold" />}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-widest">{label}</p>
      <p className="font-display text-3xl text-white mt-1">{value}</p>
    </div>
  );
}
