import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { thread_id, body } = (await req.json().catch(() => ({}))) as {
    thread_id?: string;
    body?: string;
  };
  const text = (body ?? '').trim();
  if (!thread_id || !text) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: 'too long' }, { status: 400 });
  }

  const { error } = await supabase.from('dm_messages').insert({
    thread_id,
    sender_id: user.id,
    body: text,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
