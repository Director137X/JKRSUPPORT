import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle() as any;

  if (me?.role !== 'superadmin' && !isSuperadminEmail(user.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { email_invited } = (await req.json().catch(() => ({}))) as { email_invited?: string };

  const code = randomBytes(4).toString('hex').toUpperCase();
  const admin = createServiceRoleClient();
  const { error } = await admin.from('admin_invite_codes').insert({
    code,
    created_by: user.id,
    email_invited: email_invited?.trim().toLowerCase() || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, code });
}
