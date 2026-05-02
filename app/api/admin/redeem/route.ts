import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { key } = await req.json().catch(() => ({}));
  if (!key) return NextResponse.json({ error: 'missing key' }, { status: 400 });

  const expected = process.env.ADMIN_INVITE_KEY;
  if (!expected || key !== expected) {
    return NextResponse.json({ error: 'invalid key' }, { status: 403 });
  }

  // Use service role to update role (bypasses RLS check on role column)
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id)
    .neq('role', 'superadmin');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
