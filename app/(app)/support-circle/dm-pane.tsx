'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  is_anonymous: boolean;
};

type ThreadRow = {
  id: string;
  rep_id: string;
  admin_id: string;
  last_message_at: string;
  rep?: { name: string | null; email: string };
  admin?: { name: string | null; email: string };
};

type DM = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type AdminLite = { id: string; name: string | null; email: string; role: string };

export function DMPane({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';

  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [admins, setAdmins] = useState<AdminLite[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: t, error: terr } = await supabase
        .from('dm_threads')
        .select('id,rep_id,admin_id,last_message_at')
        .order('last_message_at', { ascending: false })
        .limit(50) as any;
      if (!mounted) return;
      if (terr) { setErr(terr.message); return; }
      setThreads(t ?? []);
      if (!isAdmin) {
        const { data: a } = await supabase
          .from('admin_roster')
          .select('id,name,email,role') as any;
        setAdmins((a ?? []) as AdminLite[]);
      }
    })();
    return () => { mounted = false; };
  }, [supabase, isAdmin]);

  return (
    <div className="dm-pane">
      <aside className="dm-list">
        <div className="dm-list-head">
          {isAdmin ? 'CONVERSATIONS' : 'DM AN ADMIN'}
        </div>
        {isAdmin && threads.length === 0 && (
          <div className="dm-empty">No conversations yet. A rep can start one from this tab.</div>
        )}
        {isAdmin && threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`dm-thread-row ${active === t.id ? 'active' : ''}`}
          >
            <span className="dm-thread-id">{t.rep_id.slice(0, 8)}</span>
            <span className="dm-thread-time">{new Date(t.last_message_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
          </button>
        ))}
        {!isAdmin && admins.length === 0 && <div className="dm-empty">No admins online.</div>}
        {!isAdmin && admins.map((a) => {
          const existing = threads.find((t) => t.admin_id === a.id && t.rep_id === profile.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={async () => {
                if (existing) { setActive(existing.id); return; }
                setBusy(true);
                const res = await fetch('/api/dm/start', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ admin_id: a.id }),
                });
                setBusy(false);
                const json = await res.json().catch(() => ({}));
                if (res.ok && json.id) {
                  setThreads((prev) => prev.some((p) => p.id === json.id) ? prev : [
                    { id: json.id, rep_id: profile.id, admin_id: a.id, last_message_at: new Date().toISOString() },
                    ...prev,
                  ]);
                  setActive(json.id);
                } else {
                  setErr(json.error || 'Could not start thread');
                }
              }}
              className={`dm-thread-row ${active === existing?.id ? 'active' : ''}`}
            >
              <Lock size={11} />
              <span className="dm-thread-id">{a.name ?? a.email}</span>
              {a.role === 'superadmin' && <span className="dm-tag">S-A</span>}
            </button>
          );
        })}
      </aside>

      <section className="dm-thread">
        {active ? (
          <DMConversation thread_id={active} me={profile} />
        ) : (
          <div className="dm-empty centered">Select a conversation to begin.</div>
        )}
      </section>

      {err && <div className="f-err absolute">{err}</div>}

      <style>{DM_CSS}</style>
    </div>
  );
}

function DMConversation({ thread_id, me }: { thread_id: string; me: Profile }) {
  const supabase = createClient();
  const [msgs, setMsgs] = useState<DM[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('dm_messages')
        .select('id,thread_id,sender_id,body,created_at')
        .eq('thread_id', thread_id)
        .order('created_at', { ascending: true })
        .limit(500) as any;
      if (!mounted) return;
      setMsgs((data ?? []) as DM[]);

      // Mark every inbound message in this thread as read.
      await supabase
        .from('dm_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', thread_id)
        .neq('sender_id', me.id)
        .is('read_at', null);
    })();

    const ch = supabase
      .channel(`dm-${thread_id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${thread_id}` },
        (payload) => {
          const m = payload.new as DM;
          setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        },
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [supabase, thread_id]);

  useEffect(() => { tailRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    const res = await fetch('/api/dm/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread_id, body }),
    });
    setBusy(false);
    if (res.ok) setDraft('');
  };

  return (
    <div className="dm-conv">
      <div className="dm-conv-stream">
        {msgs.map((m) => (
          <div key={m.id} className={`dm-bubble ${m.sender_id === me.id ? 'mine' : ''}`}>
            <div className="dm-bubble-text">{m.body}</div>
            <div className="dm-bubble-time">
              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={tailRef} />
      </div>
      <form onSubmit={send} className="dm-conv-form">
        <input
          type="text"
          placeholder="Type a private message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !draft.trim()} aria-label="Send">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

const DM_CSS = `
.dm-pane {
  flex: 1; display: grid; grid-template-columns: 240px 1fr; gap: 14px;
  border: 1px solid #21262d; background: #161b22; min-height: 0;
  position: relative;
}
@media (max-width: 720px) {
  .dm-pane { grid-template-columns: 1fr; gap: 0; }
  .dm-list { border-right: 0; border-bottom: 1px solid #21262d; max-height: 200px; }
}
.dm-list { border-right: 1px solid #21262d; overflow-y: auto; padding: 8px 0; }
.dm-list-head {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  color: #c9a227; padding: 8px 14px;
}
.dm-thread-row {
  width: 100%; text-align: left;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: transparent; border: 0; cursor: pointer;
  color: #e6edf3;
  font-family: 'Barlow', sans-serif; font-size: 13px;
  border-bottom: 1px solid #21262d;
  transition: background 150ms ease;
}
.dm-thread-row:hover { background: rgba(201,162,39,0.06); }
.dm-thread-row.active { background: rgba(201,162,39,0.12); color: #c9a227; }
.dm-thread-id { flex: 1; }
.dm-thread-time, .dm-tag {
  font-family: 'Barlow Condensed', sans-serif; font-size: 9px;
  letter-spacing: 1.5px; color: #484f58;
}
.dm-tag { color: #c9a227; }
.dm-empty {
  padding: 18px 14px; color: #8b949e; font-size: 13px; line-height: 1.55;
}
.dm-empty.centered { display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; }
.dm-conv { display: flex; flex-direction: column; min-height: 0; }
.dm-conv-stream {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.dm-bubble {
  align-self: flex-start;
  max-width: 80%;
  border: 1px solid #21262d;
  background: #0d1117;
  padding: 10px 14px;
  font-size: 13.5px;
  color: #e6edf3;
  line-height: 1.5;
  white-space: pre-wrap;
}
.dm-bubble.mine {
  align-self: flex-end;
  border-color: #c9a227;
  background: rgba(201,162,39,0.08);
}
.dm-bubble-time {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 9px; letter-spacing: 1.5px; color: #484f58;
  margin-top: 4px;
}
.dm-conv-form {
  display: grid; grid-template-columns: 1fr auto; gap: 10px;
  padding: 12px; border-top: 1px solid #21262d;
}
.dm-conv-form input {
  background: transparent; border: 0; border-bottom: 1px solid #21262d;
  color: #e6edf3; font-family: 'Barlow', sans-serif; font-size: 14px;
  padding: 8px 0; outline: none; caret-color: #c9a227;
}
.dm-conv-form input::placeholder { color: #484f58; }
.dm-conv-form button {
  background: #c9a227; color: #000; border: 0;
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.dm-conv-form button:disabled { opacity: 0.4; cursor: not-allowed; }
`;
