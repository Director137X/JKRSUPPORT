import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth';
import { MasonicEye } from '@/components/masonic-eye';
import { IssueCodePanel } from './issue-code-panel';
import { LiveAIFeed } from './live-ai-feed';
import { DevConsole } from './dev-console';

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

  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const [
    { count: totalProfiles },
    { count: totalConvos },
    { count: messages24h },
    { count: circle24h },
    { count: dms24h },
    { data: anonProfiles },
    { data: aiTraffic },
    { data: codes },
    { data: dmThreads },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
    supabase.from('circle_messages').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
    supabase.from('dm_messages').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
    supabase
      .from('profiles')
      .select('id,name,email,role,position,is_anonymous,created_at')
      .eq('is_anonymous', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('messages')
      .select('id,role,content,created_at,conversation_id,conversations(user_id,title,profiles(name,email,role))')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('admin_invite_codes')
      .select('code,email_invited,redeemed_at,expires_at,created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('dm_threads')
      .select('id,rep_id,admin_id,last_message_at,created_at')
      .order('last_message_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
      />
      <style>{OVERSIGHT_CSS}</style>

      <div className="oversight-root">
        <header className="oversight-header">
          <MasonicEye size={28} className="header-eye" />
          <div>
            <div className="oversight-eyebrow">DIRECTOR ONLY · CLASSIFIED</div>
            <h1 className="oversight-title">Oversight</h1>
            <p className="oversight-sub">Identifying data revealed below is restricted. Highlighted in red — handle accordingly.</p>
          </div>
        </header>

        <section className="oversight-section">
          <h2 className="section-title">SYSTEM TELEMETRY · LAST 24h</h2>
          <div className="tele-grid">
            <Tele label="TOTAL OPERATORS" value={totalProfiles ?? 0} />
            <Tele label="AI CONVERSATIONS" value={totalConvos ?? 0} />
            <Tele label="AI MSGS / 24h" value={messages24h ?? 0} hot />
            <Tele label="CIRCLE POSTS / 24h" value={circle24h ?? 0} hot />
            <Tele label="DMs / 24h" value={dms24h ?? 0} hot />
            <Tele label="ANON OPERATORS" value={(anonProfiles ?? []).length} />
          </div>
        </section>

        <section className="oversight-section">
          <h2 className="section-title">LIVE AI TRAFFIC · UNMASKED</h2>
          <p className="section-sub">Every prompt and response across Spartan AI and The Foreman, identity attached.</p>
          <LiveAIFeed initial={(aiTraffic ?? []) as any[]} />
        </section>

        <section className="oversight-section">
          <h2 className="section-title">UNMASKED — ANONYMOUS REPS</h2>
          <p className="section-sub">Reps posting under "Anonymous Rep". Identities visible only here.</p>
          <div className="classified-table">
            <div className="ct-row ct-head">
              <span>NAME</span><span>EMAIL</span><span>ROLE</span><span>JOINED</span>
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
          <h2 className="section-title">DM CHANNELS</h2>
          <p className="section-sub">Private threads between reps and admins. Click to read on the DM tab.</p>
          <div className="classified-table">
            <div className="ct-row ct-head">
              <span>REP</span><span>ADMIN</span><span>OPENED</span><span>LAST</span>
            </div>
            {(dmThreads ?? []).map((t: any) => (
              <div key={t.id} className="ct-row">
                <span className="classified">{t.rep_id.slice(0, 8)}…</span>
                <span className="classified">{t.admin_id.slice(0, 8)}…</span>
                <span className="meta">{new Date(t.created_at).toLocaleString()}</span>
                <span className="meta">{new Date(t.last_message_at).toLocaleString()}</span>
              </div>
            ))}
            {(!dmThreads || dmThreads.length === 0) && (
              <div className="ct-empty">No DM threads yet.</div>
            )}
          </div>
        </section>

        <section className="oversight-section">
          <h2 className="section-title">ADMIN INVITE CODES</h2>
          <p className="section-sub">Issue an 8-char code, share manually, recipient redeems on signup.</p>
          <IssueCodePanel codes={(codes ?? []) as any[]} />
        </section>

        <section className="oversight-section">
          <h2 className="section-title">DEVELOPER CONSOLE · CIA</h2>
          <p className="section-sub">Live system probes. Read-only. Output mirrors what Vercel runtime sees.</p>
          <DevConsole />
        </section>
      </div>
    </>
  );
}

function Tele({ label, value, hot }: { label: string; value: number; hot?: boolean }) {
  return (
    <div className={`tele ${hot ? 'tele-hot' : ''}`}>
      <div className="tele-num">{value.toLocaleString()}</div>
      <div className="tele-lbl">{label}</div>
    </div>
  );
}

const OVERSIGHT_CSS = `
.oversight-root {
  height: 100%; overflow-y: auto;
  background: #0a0a0a; color: #e6edf3;
  padding: 36px 40px 80px;
  font-family: 'Barlow', sans-serif; font-size: 14px;
}
.oversight-header {
  display: flex; align-items: flex-start; gap: 18px;
  border-bottom: 1px solid #1A1A1A; padding-bottom: 22px; margin-bottom: 28px;
}
.header-eye { color: #C9A961; flex-shrink: 0; margin-top: 4px; }
.oversight-eyebrow { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #C9A961; margin-bottom: 6px; }
.oversight-title { font-family: 'Oswald', sans-serif; font-size: 30px; font-weight: 600; color: #F5F5F5; letter-spacing: 0.4px; }
.oversight-sub { font-size: 13px; color: #8A8A8A; margin-top: 4px; max-width: 560px; }

.oversight-section { margin: 28px 0; }
.section-title { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #C9A961; margin-bottom: 6px; }
.section-sub { font-size: 13px; color: #8A8A8A; margin-bottom: 14px; }

.tele-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
@media (max-width: 1100px) { .tele-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px) { .tele-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 720px) {
  .oversight-root { padding: 22px 16px 80px !important; }
  .oversight-title { font-size: 24px !important; }
  .ct-row { grid-template-columns: 1fr 1fr !important; gap: 4px 8px; padding: 10px !important; }
  .ct-row.ct-head { display: none !important; }
  .ct-row > span { font-size: 11px; }
}
.tele { border: 1px solid #1A1A1A; background: #050505; padding: 14px 16px; }
.tele-num { font-family: 'Oswald', sans-serif; font-size: 28px; color: #F5F5F5; line-height: 1; }
.tele-lbl { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; letter-spacing: 2px; color: #8A8A8A; text-transform: uppercase; margin-top: 6px; }
.tele-hot .tele-num { color: #C9A961; }

.classified-table { border: 1px solid #1A1A1A; background: #050505; }
.ct-row { display: grid; grid-template-columns: 1.2fr 1.5fr 0.8fr 0.8fr; padding: 10px 14px; border-bottom: 1px solid #1A1A1A; font-size: 13px; align-items: center; }
.ct-row:last-child { border-bottom: 0; }
.ct-head { background: #0A0A0A; font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #4A4A4A; }
.ct-empty { padding: 22px 14px; color: #4A4A4A; font-style: italic; text-align: center; font-size: 13px; }
.role { font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; font-size: 11px; color: #C9A961; }
.meta { color: #8A8A8A; font-size: 12px; }
.classified { color: #ff5b4a; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; background: rgba(184,74,63,0.08); border-left: 2px solid #B84A3F; padding: 4px 8px; margin-right: 6px; text-shadow: 0 0 6px rgba(255,91,74,0.45); letter-spacing: 0.02em; }
.classified::before { content: '\\26A0  '; font-size: 10px; color: #B84A3F; margin-right: 4px; }

.feed-card { border: 1px solid #1A1A1A; background: #050505; padding: 14px 16px; margin-bottom: 8px; }
.feed-meta { display: flex; gap: 10px; font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
.feed-author { color: #ff5b4a; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0; text-transform: none; }
.feed-role { color: #C9A961; }
.feed-role.assistant { color: #6E8B5A; }
.feed-time { color: #4A4A4A; margin-left: auto; }
.feed-text { font-size: 13px; color: #e6edf3; line-height: 1.55; white-space: pre-wrap; }

.dev-console { font-family: 'JetBrains Mono', monospace; }
.dev-row { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; padding: 10px 14px; border: 1px solid #1A1A1A; background: #050505; margin-bottom: 6px; }
.dev-key { color: #C9A961; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; }
.dev-val { color: #F5F5F5; font-size: 12.5px; word-break: break-all; }
.dev-status.ok { color: #6E8B5A; }
.dev-status.err { color: #B84A3F; }
.dev-status.pending { color: #C9A961; }
.dev-actions { display: flex; gap: 10px; margin: 10px 0 14px; }
.dev-btn { background: transparent; border: 1px solid #C9A961; color: #C9A961; padding: 8px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; transition: background 150ms ease; }
.dev-btn:hover:not(:disabled) { background: rgba(201,169,97,0.12); }
.dev-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.dev-out {
  margin-top: 10px;
  padding: 14px;
  background: #050505;
  border: 1px solid #1A1A1A;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  color: #6E8B5A;
  white-space: pre-wrap;
  max-height: 320px;
  overflow-y: auto;
}
`;
