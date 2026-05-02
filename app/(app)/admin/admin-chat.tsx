'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, ShieldCheck, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { CircleFeedRow } from '@/types/database';

type Profile = {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
};

export function AdminChat({ profile }: { profile: Profile }) {
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
        .eq('kind', 'admin')
        .order('created_at', { ascending: true })
        .limit(200) as any;
      if (!mounted) return;
      if (error) setErr(error.message);
      else setMessages((data ?? []) as CircleFeedRow[]);
    })();

    const channel = supabase
      .channel('admin-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'circle_messages', filter: 'kind=eq.admin' },
        async (payload) => {
          const id = (payload.new as any).id as string;
          const { data, error } = await supabase
            .from('circle_feed')
            .select('*')
            .eq('id', id)
            .eq('kind', 'admin')
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
        body: JSON.stringify({ body, is_anonymous: false, kind: 'admin' }),
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

  const remove = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    const res = await fetch('/api/circle/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setMessages((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@400;500;600;700&display=swap"
      />
      <style>{ADMIN_CSS}</style>

      <div className="ac-root">
        <header className="ac-header">
          <ShieldCheck size={22} className="ac-icon" />
          <div>
            <div className="ac-eyebrow">CHANNEL · ADMIN</div>
            <h1 className="ac-title">Admin Room</h1>
            <p className="ac-sub">Private to admins. Setters and closers can&apos;t see this.</p>
          </div>
        </header>

        <div className="ac-thread">
          {messages.length === 0 && (
            <div className="ac-empty">No messages yet. The admin room is yours to open.</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="ac-row">
              <div className="ac-row-head">
                <span className="ac-name">{m.display_name}</span>
                <span className="ac-badge">ADMIN</span>
                <span className="ac-time">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button type="button" className="ac-del" aria-label="Delete" onClick={() => remove(m.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="ac-body">{m.body}</div>
            </div>
          ))}
          <div ref={tailRef} />
        </div>

        {err && <div className="ac-err">{err}</div>}

        <form className="ac-composer" onSubmit={send}>
          <input
            type="text"
            placeholder="Speak to the admin room…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            aria-label="Post to admin channel"
          />
          <button type="submit" disabled={busy || !draft.trim()} aria-label="Send">
            <Send size={14} />
          </button>
        </form>
      </div>
    </>
  );
}

const ADMIN_CSS = `
.ac-root {
  background: #0d1117; color: #e6edf3;
  height: 100%; display: flex; flex-direction: column; min-height: 0;
  font-family: 'Barlow', sans-serif; font-size: 14px;
}
.ac-header {
  display: flex; align-items: flex-start; gap: 14px;
  border-bottom: 1px solid #21262d;
  padding: 24px 36px 18px;
}
.ac-icon { color: #c9a227; flex-shrink: 0; margin-top: 4px; }
.ac-eyebrow { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #c9a227; text-transform: uppercase; }
.ac-title { font-family: 'Oswald', sans-serif; font-size: 26px; font-weight: 600; }
.ac-sub { color: #8b949e; font-size: 13px; margin-top: 2px; }

.ac-thread {
  flex: 1; overflow-y: auto;
  padding: 18px 36px;
  display: flex; flex-direction: column; gap: 14px;
}
.ac-empty { color: #484f58; text-align: center; padding: 40px 0; font-style: italic; }
.ac-row { border-left: 2px solid #c9a227; padding: 6px 14px; }
.ac-row-head {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  margin-bottom: 4px;
}
.ac-name { color: #e6edf3; }
.ac-badge { background: #c9a227; color: #000; padding: 1px 6px; font-size: 9px; letter-spacing: 2px; }
.ac-time { color: #484f58; margin-left: auto; font-weight: 500; letter-spacing: 1px; }
.ac-del { background: transparent; border: 0; color: #484f58; cursor: pointer; padding: 0 4px; }
.ac-del:hover { color: #b84a3f; }
.ac-body { font-size: 14px; color: #e6edf3; line-height: 1.6; white-space: pre-wrap; }

.ac-err {
  margin: 0 36px 8px;
  font-family: 'Barlow Condensed', sans-serif; font-size: 11px;
  letter-spacing: 2px; text-transform: uppercase; color: #b84a3f;
}

.ac-composer {
  display: grid; grid-template-columns: 1fr auto; gap: 10px;
  border-top: 1px solid #21262d;
  padding: 14px 36px 18px;
}
.ac-composer input {
  background: transparent; border: 0; border-bottom: 1px solid #21262d;
  color: #e6edf3; font-family: 'Barlow', sans-serif; font-size: 14px;
  padding: 10px 0; outline: none; caret-color: #c9a227;
}
.ac-composer input::placeholder { color: #484f58; }
.ac-composer button {
  background: #c9a227; color: #000; border: 0;
  width: 38px; height: 38px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; border-radius: 0;
}
.ac-composer button:hover:not(:disabled) { background: #d9b831; }
.ac-composer button:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 720px) {
  .ac-header { padding: 18px 16px 14px; }
  .ac-title { font-size: 22px; }
  .ac-thread { padding: 14px 16px; }
  .ac-composer { padding: 12px 16px 16px; }
}
`;
