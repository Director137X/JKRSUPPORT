'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Bot } from 'lucide-react';
import type { Message } from '@/types/database';

type Props = {
  initialConversationId: string | null;
  initialMessages: Message[];
};

type DisplayMessage = { role: 'user' | 'assistant'; content: string };

export function CoachChat({ initialConversationId, initialMessages }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<DisplayMessage[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content })),
  );
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
      });
      if (!res.ok || !res.body) {
        throw new Error(await res.text());
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const block of events) {
          const lines = block.split('\n');
          let eventName = 'message';
          let dataLine = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim();
            if (line.startsWith('data: ')) dataLine = line.slice(6);
          }
          if (!dataLine) continue;

          if (eventName === 'meta') {
            const meta = JSON.parse(dataLine);
            if (meta.conversationId) setConversationId(meta.conversationId);
          } else if (eventName === 'token') {
            const { text } = JSON.parse(dataLine);
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last && last.role === 'assistant') {
                copy[copy.length - 1] = { ...last, content: last.content + text };
              }
              return copy;
            });
          } else if (eventName === 'error') {
            const { message } = JSON.parse(dataLine);
            setError(message || 'AI error');
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
    <div className="h-full flex flex-col bg-black">
      <div className="px-8 py-5 border-b border-line bg-panel flex items-center gap-3">
        <Bot className="text-gold" size={22} />
        <div>
          <h2 className="font-display tracking-wide text-white">Spartan AI Sales Coach</h2>
          <p className="text-xs text-zinc-500">Trained on JK&R&apos;s 8 modules. Ask for word tracks, frameworks, or live coaching.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 mt-20">
              <Bot size={48} className="mx-auto mb-4 opacity-30 text-gold" />
              <p className="font-display tracking-wide text-lg text-white">Welcome to the Coach.</p>
              <p className="text-sm mt-2">Ask about an objection, a word track, or a stage of the roadmap.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className={`text-xs font-semibold mb-1 ${m.role === 'user' ? 'text-zinc-400' : 'text-gold'}`}>
                {m.role === 'user' ? 'You' : 'Spartan AI'}
              </span>
              <div
                className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-line text-white border border-line rounded-tr-sm'
                    : 'bg-surface text-zinc-100 border border-gold/20 rounded-tl-sm'
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? <DotDotDot /> : '')}
              </div>
            </div>
          ))}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/40 rounded text-red-200 text-sm">
              {error}
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="px-8 py-5 border-t border-line bg-panel">
        <form onSubmit={send} className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Coach…"
            disabled={streaming}
            className="flex-1 bg-black border border-line rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-gold disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="w-12 h-12 rounded-full bg-gold text-black flex items-center justify-center hover:bg-yellow-400 disabled:opacity-40 shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function DotDotDot() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" />
      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.15s' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0.3s' }} />
    </span>
  );
}
