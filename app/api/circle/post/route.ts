import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { body, is_anonymous, reply_to, kind } = (await req.json().catch(() => ({}))) as {
    body?: string;
    is_anonymous?: boolean;
    reply_to?: string | null;
    kind?: 'public' | 'admin';
  };
  const text = (body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'empty body' }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: 'too long' }, { status: 400 });
  const channel = kind === 'admin' ? 'admin' : 'public';

  const { data, error } = await supabase
    .from('circle_messages')
    .insert({
      author_id: user.id,
      is_anonymous: !!is_anonymous,
      body: text,
      reply_to: reply_to ?? null,
      kind: channel,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[circle.post]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data?.id });
}
