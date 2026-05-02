'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  position: 'closer' | 'setter' | 'admin' | 'superadmin' | null;
  is_anonymous: boolean;
  created_at: string;
};

export function MembersGrid({ members, meId, isSuper }: { members: Member[]; meId: string; isSuper: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Hide the existence of "superadmin" — fold them into Admin to anyone who's not super.
  const visible = members.filter((m) => m.id !== meId);
  const closers = visible.filter((m) => m.position === 'closer' || (m.role === 'user' && !m.position));
  const setters = visible.filter((m) => m.position === 'setter');
  const admins = isSuper
    ? visible.filter((m) => m.role === 'admin' || m.role === 'superadmin')
    : visible.filter((m) => m.role === 'admin' || m.role === 'superadmin'); // same list, label hides distinction

  const dm = async (otherId: string) => {
    setBusy(otherId);
    setErr(null);
    const res = await fetch('/api/dm/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ other_id: otherId }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setErr(json.error || 'Could not start thread');
      return;
    }
    router.push('/support-circle?dm=' + json.id);
  };

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
            <p className="members-sub">Click anyone to start a private conversation.</p>
          </header>

          {err && <div className="m-err">{err}</div>}

          <Group title="ADMINS"  rows={admins}  busy={busy} onDM={dm} />
          <Group title="CLOSERS" rows={closers} busy={busy} onDM={dm} />
          <Group title="SETTERS" rows={setters} busy={busy} onDM={dm} />
        </div>
      </div>
    </>
  );
}

function Group({
  title,
  rows,
  busy,
  onDM,
}: {
  title: string;
  rows: Member[];
  busy: string | null;
  onDM: (id: string) => void;
}) {
  if (!rows.length) return null;
  return (
    <section className="group">
      <h2 className="group-title">{title}</h2>
      <div className="group-grid">
        {rows.map((r) => (
          <button key={r.id} type="button" className="m-card" onClick={() => onDM(r.id)} disabled={busy === r.id}>
            <div className="m-avatar">{(r.name?.[0] ?? r.email[0] ?? '?').toUpperCase()}</div>
            <div className="m-info">
              <div className="m-name">{r.name ?? r.email}</div>
              <div className="m-pos">{r.position ?? 'Member'}</div>
            </div>
            <span className="m-dm">
              <MessageCircle size={14} />
            </span>
          </button>
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
@media (max-width: 720px) {
  .members-wrap { padding: 22px 16px 80px; }
  .members-title { font-size: 24px; }
  .group-grid { grid-template-columns: 1fr !important; }
}
.members-header { border-bottom: 1px solid #21262d; padding-bottom: 22px; margin-bottom: 24px; }
.members-eyebrow { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #c9a227; text-transform: uppercase; margin-bottom: 6px; }
.members-title { font-family: 'Oswald', sans-serif; font-size: 30px; font-weight: 600; }
.members-sub { color: #8b949e; font-size: 13px; margin-top: 4px; }

.m-err { color: #b84a3f; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 8px 0; }

.group { margin: 28px 0; }
.group-title { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #c9a227; text-transform: uppercase; margin-bottom: 10px; }
.group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }

.m-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: #161b22;
  border: 1px solid #21262d;
  text-align: left;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
  border-radius: 0;
}
.m-card:hover:not(:disabled) { background: #1a2029; border-color: #c9a227; }
.m-card:disabled { opacity: 0.5; cursor: not-allowed; }
.m-avatar {
  width: 36px; height: 36px; border-radius: 999px; flex-shrink: 0;
  background: rgba(201,162,39,0.15); color: #c9a227;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: 'Oswald', sans-serif; font-size: 14px; font-weight: 600;
}
.m-info { flex: 1; min-width: 0; }
.m-name { color: #e6edf3; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-pos { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #8b949e; margin-top: 2px; }
.m-dm { color: #c9a227; flex-shrink: 0; }
`;
