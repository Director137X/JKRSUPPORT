import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'superadmin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { email, role } = (await req.json().catch(() => ({}))) as { email?: string; role?: 'admin' | 'user' };
  if (!email || !role) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  if (role !== 'admin' && role !== 'user') return NextResponse.json({ error: 'bad role' }, { status: 400 });

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('email', email.toLowerCase())
    .neq('role', 'superadmin');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
