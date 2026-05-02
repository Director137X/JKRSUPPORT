import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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

  const t0 = Date.now();
  const checks: Record<string, any> = {};
  for (const table of ['profiles', 'conversations', 'messages', 'circle_messages', 'dm_threads', 'dm_messages', 'kpis', 'admin_invite_codes', 'identity_reveal_log']) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      checks[table] = error ? { ok: false, error: error.message } : { ok: true, rows: count ?? 0 };
    } catch (err) {
      checks[table] = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  return NextResponse.json({ ok: true, latency_ms: Date.now() - t0, tables: checks });
}
