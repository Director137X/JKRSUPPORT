import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { admin_id } = (await req.json().catch(() => ({}))) as { admin_id?: string };
  if (!admin_id) return NextResponse.json({ error: 'missing admin_id' }, { status: 400 });

  const { data: target } = await supabase
    .from('profiles')
    .select('id,role')
    .eq('id', admin_id)
    .maybeSingle() as any;
  if (!target || !['admin', 'superadmin'].includes(target.role)) {
    return NextResponse.json({ error: 'target is not an admin' }, { status: 400 });
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('id,role')
    .eq('id', user.id)
    .maybeSingle() as any;

  // Decide who is rep / admin in the pair.
  const repId = me?.role === 'admin' || me?.role === 'superadmin' ? admin_id : user.id;
  const adminId = repId === user.id ? admin_id : user.id;

  const { data: existing } = await supabase
    .from('dm_threads')
    .select('id')
    .eq('rep_id', repId)
    .eq('admin_id', adminId)
    .maybeSingle() as any;
  if (existing?.id) return NextResponse.json({ ok: true, id: existing.id });

  const { data: created, error } = await supabase
    .from('dm_threads')
    .insert({ rep_id: repId, admin_id: adminId })
    .select('id')
    .single() as any;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: created.id });
}
