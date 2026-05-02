import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminViewPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single() as any;
  if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) redirect('/coach');
  const isSuper = me.role === 'superadmin' || isSuperadminEmail(me.email);

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const [
    { count: userCount },
    { count: circleTotal },
    { count: circleToday },
    { data: recentCircle },
    { data: users },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('circle_messages').select('*', { count: 'exact', head: true }).eq('kind', 'public'),
    supabase.from('circle_messages').select('*', { count: 'exact', head: true }).eq('kind', 'public').gte('created_at', todayStart),
    supabase
      .from('circle_feed')
      .select('id,display_name,author_role,body,created_at,is_anonymous')
      .eq('kind', 'public')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('profiles')
      .select('id,name,email,role,position,is_anonymous,created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-8 sm:py-10 scrollbar-thin">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="font-display text-2xl tracking-wide text-white">Admin View</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isSuper ? 'Full identities visible.' : 'Anonymous reps masked.'}
          </p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Total members" value={userCount ?? 0} />
          <Stat label="Circle posts (all-time)" value={circleTotal ?? 0} />
          <Stat label="Circle posts today" value={circleToday ?? 0} />
        </section>

        <section>
          <h2 className="font-display text-sm tracking-widest uppercase text-gold mb-3">Recent in The Circle</h2>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-zinc-400 text-xs uppercase tracking-widest hidden sm:table-header-group">
                <tr>
                  <th className="text-left px-4 py-3">Author</th>
                  <th className="text-left px-4 py-3">Message</th>
                  <th className="text-left px-4 py-3">Posted</th>
                </tr>
              </thead>
              <tbody>
                {(recentCircle ?? []).map((c: any) => (
                  <tr key={c.id} className="border-t border-line hover:bg-surface-2/50">
                    <td className="px-4 py-3 text-white whitespace-nowrap">
                      {c.display_name}
                      {(c.author_role === 'admin' || c.author_role === 'superadmin') && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gold text-black text-[9px] tracking-widest">ADMIN</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 max-w-md truncate">{c.body}</td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
                {(!recentCircle || recentCircle.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center text-zinc-500 py-8">No Circle posts yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-sm tracking-widest uppercase text-gold mb-3">All members</h2>
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-zinc-400 text-xs uppercase tracking-widest hidden sm:table-header-group">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u: any) => (
                  <tr key={u.id} className="border-t border-line hover:bg-surface-2/50">
                    <td className="px-4 py-3 text-white">
                      {u.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{isSuper ? u.email : '—'}</td>
                    <td className="px-4 py-3 text-gold capitalize">
                      {u.role === 'admin' || u.role === 'superadmin' ? 'admin' : u.position ?? 'member'}
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
