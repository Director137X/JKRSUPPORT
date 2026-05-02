import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code || code.length < 4) {
    return NextResponse.json({ error: 'invalid code' }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: row, error } = await admin
    .from('admin_invite_codes')
    .select('code,redeemed_at,expires_at')
    .eq('code', code.trim())
    .maybeSingle() as any;

  if (error || !row) {
    return NextResponse.json({ error: 'code not found' }, { status: 404 });
  }
  if (row.redeemed_at) {
    return NextResponse.json({ error: 'code already used' }, { status: 409 });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'code expired' }, { status: 410 });
  }

  const { error: updateRoleErr } = await admin
    .from('profiles')
    .update({ role: 'admin', position: 'admin' })
    .eq('id', user.id);
  if (updateRoleErr) {
    return NextResponse.json({ error: updateRoleErr.message }, { status: 500 });
  }

  await admin
    .from('admin_invite_codes')
    .update({ redeemed_by: user.id, redeemed_at: new Date().toISOString() })
    .eq('code', row.code);

  return NextResponse.json({ ok: true, role: 'admin' });
}
