'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Lock, EyeOff, Eye, Users, ShieldCheck, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { CircleFeedRow } from '@/types/database';
import { DMPane } from './dm-pane';

type Profile = {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  is_anonymous: boolean;
};

type Tab = 'circle' | 'dms';

export function SupportCircle({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>('circle');
  const [anonymous, setAnonymous] = useState<boolean>(profile.is_anonymous);
  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';

  return (
    <div className="circle-root">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@400;500;600;700&display=swap"
      />
      <style>{CIRCLE_CSS}</style>

      <header className="circle-header">
        <div className="circle-header-left">
          <div className="circle-eyebrow">JK&amp;R</div>
          <h1 className="circle-title">Support Circle</h1>
          <p className="circle-sub">Group chat for the field. Here to support each other.</p>
        </div>

        <div className="circle-header-right">
          <button
            type="button"
            onClick={() => setAnonymous((v) => !v)}
            className={`identity-toggle ${anonymous ? 'is-anon' : ''}`}
            aria-pressed={anonymous}
            title={anonymous ? 'You are posting anonymously' : 'You are posting as yourself'}
          >
            {anonymous ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{anonymous ? 'ANON' : (profile.name ?? profile.email)}</span>
          </button>
        </div>
      </header>

      <div className="circle-tabs">
        <button
          type="button"
          className={`circle-tab ${tab === 'circle' ? 'active' : ''}`}
          onClick={() => setTab('circle')}
        >
          <Users size={14} />
          <span>The Circle</span>
        </button>
        <button
          type="button"
          className={`circle-tab ${tab === 'dms' ? 'active' : ''}`}
          onClick={() => setTab('dms')}
        >
          <Lock size={14} />
          <span>{isAdmin ? 'Direct Messages' : 'Message an Admin'}</span>
        </button>
      </div>

      <main className="circle-main">
        {tab === 'circle'
          ? <CirclePane anonymous={anonymous} profile={profile} />
          : <DMPane profile={profile} />}
      </main>
    </div>
  );
}

function CirclePane({ anonymous, profile }: { anonymous: boolean; profile: Profile }) {
  const supabase = createClient();
  const [messages, setMessages] = useState<CircleFeedRow[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from('circle_feed')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200) as any;
      if (!mounted) return;
      if (error) setErr(error.message);
      else setMessages((data ?? []) as CircleFeedRow[]);
    })();

    const channel = supabase
      .channel('circle-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'circle_messages' },
        async (payload) => {
          const id = (payload.new as any).id as string;
          const { data, error } = await supabase
            .from('circle_feed')
            .select('*')
            .eq('id', id)
            .maybeSingle() as any;
          if (!error && data) {
            setMessages((m) => (m.some((x) => x.id === data.id) ? m : [...m, data as CircleFeedRow]));
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/circle/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, is_anonymous: anonymous }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Post failed' }));
        setErr(error || 'Post failed');
      } else {
        setDraft('');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="circle-pane">
      <div className="circle-thread">
        {messages.length === 0 && (
          <SystemLine text="The Circle is quiet. Be the first to speak." />
        )}
        {messages.map((m) => (
          <CircleRow
            key={m.id}
            m={m}
            meId={profile.id}
            canDelete={profile.role === 'admin' || profile.role === 'superadmin'}
            onDelete={async (id) => {
              if (!confirm('Delete this message?')) return;
              const res = await fetch('/api/circle/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
              });
              if (res.ok) {
                setMessages((prev) => prev.filter((x) => x.id !== id));
              } else {
                const { error } = await res.json().catch(() => ({ error: 'Delete failed' }));
                setErr(error || 'Delete failed');
              }
            }}
          />
        ))}
        <div ref={tailRef} />
      </div>

      {err && <div className="f-err">{err}</div>}

      <form className="circle-composer" onSubmit={send}>
        <div className="composer-meta">
          <span className="composer-as">POSTING AS</span>
          <span className={`composer-name ${anonymous ? 'anon' : ''}`}>
            {anonymous
              ? (profile.role === 'user' ? 'ANONYMOUS REP' : 'ANONYMOUS ADMIN')
              : profile.name ?? profile.email}
          </span>
          {(profile.role === 'admin' || profile.role === 'superadmin') && (
            <span className="composer-badge">ADMIN</span>
          )}
        </div>
        <div className="composer-row">
          <input
            type="text"
            placeholder="Speak to the Circle…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            aria-label="Post to Support Circle"
          />
          <button type="submit" disabled={busy || !draft.trim()} aria-label="Send">
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

function CircleRow({
  m,
  canDelete,
  onDelete,
}: {
  m: CircleFeedRow;
  meId: string;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const isAdminPost = m.author_role === 'admin' || m.author_role === 'superadmin';
  return (
    <div className="row">
      <div className="row-head">
        <span className="row-name">{m.display_name}</span>
        {isAdminPost && <span className="row-badge">ADMIN</span>}
        <span className="row-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {canDelete && (
          <button
            type="button"
            className="row-del"
            aria-label="Delete message"
            onClick={() => onDelete(m.id)}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <div className="row-body">{m.body}</div>
    </div>
  );
}

function SystemLine({ text }: { text: string }) {
  return (
    <div className="system-line">
      <span className="system-rule" />
      <span className="system-text">{text}</span>
      <span className="system-rule" />
    </div>
  );
}

const CIRCLE_CSS = `
.circle-root {
  background: #0d1117;
  color: #e6edf3;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Barlow', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  overflow: hidden;
}
.circle-header {
  border-bottom: 1px solid #21262d;
  padding: 28px 36px 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
@media (max-width: 720px) {
  .circle-header { padding: 20px 16px 14px; }
  .circle-title { font-size: 22px !important; }
  .circle-tabs { padding: 0 16px !important; }
  .circle-main { padding: 0 16px 16px !important; }
}
.circle-eyebrow {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #c9a227;
  margin-bottom: 6px;
}
.circle-title {
  font-family: 'Oswald', sans-serif;
  font-size: 28px;
  font-weight: 600;
  color: #e6edf3;
  letter-spacing: 0.5px;
}
.circle-sub { font-size: 13px; color: #8b949e; margin-top: 4px; }
.identity-toggle {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  border: 1px solid #c9a227;
  background: rgba(201,162,39,0.08);
  color: #c9a227;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; border-radius: 0;
  transition: background 150ms ease, color 150ms ease;
}
.identity-toggle:hover { background: rgba(201,162,39,0.18); }
.identity-toggle.is-anon {
  border-color: #6E8B5A; color: #cce0bd; background: rgba(110,139,90,0.10);
}
.circle-tabs { display: flex; border-bottom: 1px solid #21262d; padding: 0 36px; }
.circle-tab {
  display: inline-flex; align-items: center; gap: 8px; padding: 14px 18px;
  background: transparent; border: 0; color: #8b949e;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; border-bottom: 2px solid transparent;
  transition: color 150ms ease, border-color 150ms ease;
}
.circle-tab:hover { color: #e6edf3; }
.circle-tab.active { color: #c9a227; border-bottom-color: #c9a227; }
.circle-main { flex: 1; overflow: hidden; display: flex; flex-direction: column; padding: 0 36px 28px; }
.circle-pane { flex: 1; display: flex; flex-direction: column; gap: 18px; padding: 22px 0 0; overflow: hidden; }
.circle-thread {
  flex: 1; overflow-y: auto; border: 1px solid #21262d; background: #161b22;
  padding: 18px; display: flex; flex-direction: column; gap: 14px;
}
.system-line {
  display: flex; align-items: center; gap: 12px; color: #484f58;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
  margin: 24px 0;
}
.system-rule { flex: 1; height: 1px; background: #21262d; }
.system-text { white-space: nowrap; }
.row {
  border-left: 2px solid #21262d;
  padding: 6px 14px;
}
.row.mine { border-left-color: #c9a227; }
.row-head {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  margin-bottom: 4px;
}
.row-name { color: #e6edf3; }
.row-badge {
  display: inline-block;
  padding: 1px 6px;
  background: #c9a227;
  color: #000;
  font-size: 9px;
  letter-spacing: 2px;
}
.row-time { color: #484f58; margin-left: auto; font-weight: 500; letter-spacing: 1px; }
.row-del {
  background: transparent; border: 0; color: #484f58; cursor: pointer; padding: 0 4px;
  display: inline-flex; align-items: center;
  transition: color 150ms ease;
}
.row-del:hover { color: #b84a3f; }
.row-body { font-size: 14px; color: #e6edf3; line-height: 1.65; white-space: pre-wrap; }

.circle-composer { border: 1px solid #21262d; background: #161b22; padding: 12px 16px; }
.composer-meta {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  color: #484f58;
}
.composer-name { color: #e6edf3; }
.composer-name.anon { color: #8b949e; font-style: italic; }
.composer-badge {
  background: #c9a227;
  color: #000;
  padding: 1px 6px;
  font-size: 9px;
  letter-spacing: 2px;
}
.composer-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
.composer-row input {
  background: transparent; border: 0; border-bottom: 1px solid #21262d;
  color: #e6edf3; font-family: 'Barlow', sans-serif; font-size: 14px;
  padding: 8px 0; outline: none; caret-color: #c9a227;
}
.composer-row input::placeholder { color: #484f58; }
.composer-row button {
  background: #c9a227; color: #000; border: 0;
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; border-radius: 0;
  transition: background 150ms ease, opacity 150ms ease;
}
.composer-row button:hover:not(:disabled) { background: #d9b831; }
.composer-row button:disabled { opacity: 0.4; cursor: not-allowed; }
.f-err {
  font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 600;
  letter-spacing: 2px; text-transform: uppercase; color: #b84a3f;
}
`;
