import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { other_id?: string; admin_id?: string };
  const other = body.other_id ?? body.admin_id;
  if (!other) return NextResponse.json({ error: 'missing other_id' }, { status: 400 });
  if (other === user.id) return NextResponse.json({ error: 'cannot DM yourself' }, { status: 400 });

  // dm_threads keeps two columns (rep_id / admin_id) for compatibility — we
  // canonicalize the pair so a thread between A,B never duplicates as B,A.
  const [a, b] = [user.id, other].sort();
  const { data: existing } = await supabase
    .from('dm_threads')
    .select('id')
    .eq('rep_id', a)
    .eq('admin_id', b)
    .maybeSingle() as any;
  if (existing?.id) return NextResponse.json({ ok: true, id: existing.id });

  const { data: created, error } = await supabase
    .from('dm_threads')
    .insert({ rep_id: a, admin_id: b })
    .select('id')
    .single() as any;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: created.id });
}
