'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

export function ForemanChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setStreaming(true);
    try {
      const res = await fetch('/api/foreman/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
      });
      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => '');
        throw new Error(err || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() ?? '';
        for (const block of events) {
          let name = 'message';
          let data = '';
          for (const ln of block.split('\n')) {
            if (ln.startsWith('event: ')) name = ln.slice(7).trim();
            if (ln.startsWith('data: ')) data = ln.slice(6);
          }
          if (!data) continue;
          if (name === 'meta') {
            const meta = JSON.parse(data);
            if (meta.conversationId) setConversationId(meta.conversationId);
          } else if (name === 'token') {
            const { text: t } = JSON.parse(data);
            setMessages((m) => {
              const cp = [...m];
              const last = cp[cp.length - 1];
              if (last && last.role === 'assistant') cp[cp.length - 1] = { ...last, content: last.content + t };
              return cp;
            });
          } else if (name === 'error') {
            const { message } = JSON.parse(data);
            setError(message || 'Foreman error');
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="foreman-panel">
      <div className="foreman-header">
        <div className="foreman-eyebrow">ASK THE FOREMAN</div>
        <div className="foreman-sub">Live coaching. Powered by your training library.</div>
      </div>

      {messages.length > 0 && (
        <div className="foreman-stream">
          {messages.map((m, i) => (
            <div key={i} className={`f-msg ${m.role}`}>
              <div className="f-msg-label">{m.role === 'user' ? 'OPERATOR' : 'THE FOREMAN'}</div>
              <div className="f-msg-text">{m.content || (streaming && i === messages.length - 1 ? '…' : '')}</div>
            </div>
          ))}
          <div ref={tailRef} />
        </div>
      )}

      {error && <div className="f-err">{error}</div>}

      <form onSubmit={send} className="foreman-form">
        <div className="foreman-field">
          <input
            type="text"
            placeholder="Ask about an objection, a KPI, or a drill…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            aria-label="Ask the Foreman"
          />
          <span className="f-underline" />
        </div>
        <button type="submit" disabled={streaming || !input.trim()} className="foreman-btn">
          {streaming ? 'WORKING' : 'RUN IT'}
        </button>
      </form>
    </div>
  );
}
