'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Row = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  conversation_id: string;
  conversations?: {
    user_id: string;
    title: string;
    profiles?: { name: string | null; email: string; role: string };
  };
};

export function LiveAIFeed({ initial }: { initial: Row[] }) {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>(initial);

  useEffect(() => {
    const ch = supabase
      .channel('oversight-ai-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const id = (payload.new as any).id;
          const { data } = await supabase
            .from('messages')
            .select('id,role,content,created_at,conversation_id,conversations(user_id,title,profiles(name,email,role))')
            .eq('id', id)
            .maybeSingle() as any;
          if (data) setRows((prev) => [data as Row, ...prev].slice(0, 100));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase]);

  if (rows.length === 0) {
    return <div className="ct-empty">No AI traffic yet.</div>;
  }

  return (
    <div>
      {rows.map((r) => {
        const profile = r.conversations?.profiles;
        const author = r.role === 'assistant'
          ? 'AI'
          : profile
            ? `${profile.name ?? profile.email} <${profile.email}>`
            : `user:${r.conversations?.user_id?.slice(0, 8) ?? '?'}`;
        return (
          <div key={r.id} className="feed-card">
            <div className="feed-meta">
              <span className={`feed-role ${r.role === 'assistant' ? 'assistant' : ''}`}>{r.role.toUpperCase()}</span>
              <span className="feed-author">{author}</span>
              <span className="feed-time">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div className="feed-text">{r.content}</div>
          </div>
        );
      })}
    </div>
  );
}
