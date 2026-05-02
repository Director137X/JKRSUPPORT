import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('profiles')
    .select('role,email')
    .eq('id', user.id)
    .maybeSingle() as any;

  const isAdmin = me?.role === 'admin' || me?.role === 'superadmin';
  const isSuper = me?.role === 'superadmin' || isSuperadminEmail(me?.email ?? user.email);
  if (!isAdmin) redirect('/coach');

  const { data: members } = await supabase
    .from('profiles')
    .select('id,name,email,role,position,is_anonymous,created_at')
    .order('created_at', { ascending: false }) as any;

  const [closers, setters, admins, supers] = [
    (members ?? []).filter((m: any) => m.position === 'closer' || (m.role === 'user' && !m.position)),
    (members ?? []).filter((m: any) => m.position === 'setter'),
    (members ?? []).filter((m: any) => m.role === 'admin'),
    (members ?? []).filter((m: any) => m.role === 'superadmin'),
  ];

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@400;500;600;700&display=swap"
      />
      <style>{MEMBERS_CSS}</style>

      <div className="members-root">
        <div className="members-wrap">
          <header className="members-header">
            <div className="members-eyebrow">JK&amp;R · ROSTER</div>
            <h1 className="members-title">Members</h1>
            <p className="members-sub">{(members ?? []).length} total — closers, setters, admins, leadership.</p>
          </header>

          <Stat counts={{ closers: closers.length, setters: setters.length, admins: admins.length, supers: supers.length }} />

          <Group title="SUPERADMIN" rows={supers} isSuper={isSuper} />
          <Group title="ADMINS"     rows={admins} isSuper={isSuper} />
          <Group title="CLOSERS"    rows={closers} isSuper={isSuper} />
          <Group title="SETTERS"    rows={setters} isSuper={isSuper} />
        </div>
      </div>
    </>
  );
}

function Stat({ counts }: { counts: { closers: number; setters: number; admins: number; supers: number } }) {
  return (
    <div className="stat-row">
      <div className="stat"><div className="stat-num">{counts.closers}</div><div className="stat-lbl">CLOSERS</div></div>
      <div className="stat"><div className="stat-num">{counts.setters}</div><div className="stat-lbl">SETTERS</div></div>
      <div className="stat"><div className="stat-num">{counts.admins}</div><div className="stat-lbl">ADMINS</div></div>
      <div className="stat"><div className="stat-num">{counts.supers}</div><div className="stat-lbl">SUPERADMIN</div></div>
    </div>
  );
}

function Group({ title, rows, isSuper }: { title: string; rows: any[]; isSuper: boolean }) {
  if (!rows.length) return null;
  return (
    <section className="group">
      <h2 className="group-title">{title}</h2>
      <div className="group-table">
        <div className="g-row g-head">
          <span>NAME</span>
          <span>EMAIL</span>
          <span>POSITION</span>
          <span>JOINED</span>
          <span>ANON</span>
        </div>
        {rows.map((r) => (
          <div key={r.id} className="g-row">
            <span className="g-name">{r.name || '—'}</span>
            <span className="g-mail">{r.email}</span>
            <span className="g-pos">{r.position ?? '—'}</span>
            <span className="g-time">{new Date(r.created_at).toLocaleDateString()}</span>
            <span className={`g-anon ${r.is_anonymous ? 'on' : 'off'}`}>{r.is_anonymous ? '●' : '—'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const MEMBERS_CSS = `
.members-root {
  background: #0d1117; color: #e6edf3; min-height: 100%; height: 100%; overflow-y: auto;
  font-family: 'Barlow', sans-serif; font-size: 14px;
}
.members-wrap { max-width: 1080px; margin: 0 auto; padding: 48px 40px 96px; }
.members-header { border-bottom: 1px solid #21262d; padding-bottom: 22px; margin-bottom: 24px; }
.members-eyebrow { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #c9a227; text-transform: uppercase; margin-bottom: 6px; }
.members-title { font-family: 'Oswald', sans-serif; font-size: 30px; font-weight: 600; }
.members-sub { color: #8b949e; font-size: 13px; margin-top: 4px; }

.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 32px; }
.stat { border: 1px solid #21262d; background: #161b22; padding: 16px 18px; }
.stat-num { font-family: 'Oswald', sans-serif; font-size: 28px; color: #c9a227; }
.stat-lbl { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; letter-spacing: 2px; color: #8b949e; text-transform: uppercase; margin-top: 2px; }

.group { margin: 28px 0; }
.group-title { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #c9a227; text-transform: uppercase; margin-bottom: 8px; }
.group-table { border: 1px solid #21262d; background: #161b22; }
.g-row {
  display: grid; grid-template-columns: 1.4fr 1.8fr 1fr 1fr 0.5fr;
  padding: 8px 14px; border-bottom: 1px solid #21262d; align-items: center;
  font-size: 13px;
}
.g-row:last-child { border-bottom: 0; }
.g-row.g-head { background: #0d1117; font-family: 'Barlow Condensed', sans-serif; font-size: 10px; letter-spacing: 2px; color: #c9a227; text-transform: uppercase; }
.g-name { color: #e6edf3; }
.g-mail { color: #8b949e; }
.g-pos { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #c9a227; }
.g-time { color: #484f58; font-size: 12px; }
.g-anon.on { color: #c9a227; }
.g-anon.off { color: #484f58; }
`;
