import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth';
import { MasonicEye } from '@/components/masonic-eye';
import { IssueCodePanel } from './issue-code-panel';

export const dynamic = 'force-dynamic';

export default async function OversightPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,name,email,role,is_anonymous')
    .eq('id', user.id)
    .single() as any;

  const isSuper = profile?.role === 'superadmin' || isSuperadminEmail(profile?.email ?? user.email);
  if (!isSuper) redirect('/coach');

  const [{ data: anonProfiles }, { data: recentMessages }, { data: codes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,name,email,role,is_anonymous,created_at')
      .eq('is_anonymous', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('messages')
      .select('id,role,content,created_at,conversation_id')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('admin_invite_codes')
      .select('code,email_invited,redeemed_at,expires_at,created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
      />
      <style>{OVERSIGHT_CSS}</style>

      <div className="oversight-root">
        <header className="oversight-header">
          <MasonicEye size={28} className="header-eye" />
          <div>
            <div className="oversight-eyebrow">SUPER-ADMIN ONLY</div>
            <h1 className="oversight-title">Oversight</h1>
            <p className="oversight-sub">
              Identifying data revealed below is restricted. Highlighted in red — handle accordingly.
            </p>
          </div>
        </header>

        <section className="oversight-section">
          <h2 className="section-title">UNMASKED — ANONYMOUS REPS</h2>
          <p className="section-sub">Reps posting under "Anonymous Rep". Identities visible only here.</p>

          <div className="classified-table">
            <div className="ct-row ct-head">
              <span>NAME</span>
              <span>EMAIL</span>
              <span>ROLE</span>
              <span>JOINED</span>
            </div>
            {(anonProfiles ?? []).map((p: any) => (
              <div key={p.id} className="ct-row">
                <span className="classified">{p.name ?? '—'}</span>
                <span className="classified">{p.email}</span>
                <span className="role">{p.role}</span>
                <span className="meta">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {(!anonProfiles || anonProfiles.length === 0) && (
              <div className="ct-empty">No anonymous reps yet.</div>
            )}
          </div>
        </section>

        <section className="oversight-section">
          <h2 className="section-title">RECENT TRAFFIC — AI CONVERSATIONS</h2>
          <p className="section-sub">Last 20 messages across Spartan AI and The Foreman.</p>

          <div className="traffic-list">
            {(recentMessages ?? []).map((m: any) => (
              <div key={m.id} className="traffic-row">
                <div className="t-meta">
                  <span className={`t-role ${m.role}`}>{m.role.toUpperCase()}</span>
                  <span className="t-time">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <div className="t-text">{m.content}</div>
              </div>
            ))}
            {(!recentMessages || recentMessages.length === 0) && (
              <div className="ct-empty">No traffic yet.</div>
            )}
          </div>
        </section>

        <section className="oversight-section">
          <h2 className="section-title">ADMIN INVITE CODES</h2>
          <p className="section-sub">Issue a 8-char code, share manually or by email, recipient redeems on signup.</p>
          <IssueCodePanel codes={(codes ?? []) as any[]} />
        </section>
      </div>
    </>
  );
}

const OVERSIGHT_CSS = `
.oversight-root {
  height: 100%;
  overflow-y: auto;
  background: #0a0a0a;
  color: #e6edf3;
  padding: 36px 40px 80px;
  font-family: 'Barlow', sans-serif;
  font-size: 14px;
}
.oversight-header {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  border-bottom: 1px solid #1A1A1A;
  padding-bottom: 22px;
  margin-bottom: 28px;
}
.header-eye { color: #C9A961; flex-shrink: 0; margin-top: 4px; }
.oversight-eyebrow {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #C9A961;
  margin-bottom: 6px;
}
.oversight-title {
  font-family: 'Oswald', sans-serif;
  font-size: 30px;
  font-weight: 600;
  color: #F5F5F5;
  letter-spacing: 0.4px;
}
.oversight-sub {
  font-size: 13px;
  color: #8A8A8A;
  margin-top: 4px;
  max-width: 560px;
}
.oversight-section { margin: 28px 0; }
.section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #C9A961;
  margin-bottom: 6px;
}
.section-sub { font-size: 13px; color: #8A8A8A; margin-bottom: 14px; }

.classified-table { border: 1px solid #1A1A1A; background: #050505; }
.ct-row {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 0.8fr 0.8fr;
  padding: 10px 14px;
  border-bottom: 1px solid #1A1A1A;
  font-size: 13px;
  align-items: center;
}
.ct-row:last-child { border-bottom: 0; }
.ct-head {
  background: #0A0A0A;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #4A4A4A;
}
.ct-empty {
  padding: 22px 14px;
  color: #4A4A4A;
  font-style: italic;
  text-align: center;
  font-size: 13px;
}
.role {
  font-family: 'Barlow Condensed', sans-serif;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-size: 11px;
  color: #C9A961;
}
.meta { color: #8A8A8A; font-size: 12px; }

/* CLASSIFIED — call-of-war style red glow on revealed identity */
.classified {
  color: #ff5b4a;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  background: rgba(184,74,63,0.08);
  border-left: 2px solid #B84A3F;
  padding: 4px 8px;
  margin-right: 6px;
  text-shadow: 0 0 6px rgba(255,91,74,0.45);
  letter-spacing: 0.02em;
}
.classified::before {
  content: '\\26A0  ';
  font-size: 10px;
  color: #B84A3F;
  margin-right: 4px;
}

.traffic-list { border: 1px solid #1A1A1A; background: #050505; padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.traffic-row { padding: 8px 0; border-bottom: 1px solid #1A1A1A; }
.traffic-row:last-child { border-bottom: 0; }
.t-meta {
  display: flex;
  gap: 12px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.t-role.user { color: #8A8A8A; }
.t-role.assistant { color: #C9A961; }
.t-time { color: #4A4A4A; }
.t-text { font-size: 13px; color: #e6edf3; line-height: 1.55; white-space: pre-wrap; }
`;
