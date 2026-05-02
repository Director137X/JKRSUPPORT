import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'NEXT_PUBLIC_APP_URL',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
];

function describe(value: string | undefined) {
  if (!value) return { set: false };
  return {
    set: true,
    length: value.length,
    has_trailing_whitespace: value !== value.trim(),
    last4: value.length > 4 ? value.slice(-4) : null,
  };
}

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

  const env: Record<string, ReturnType<typeof describe>> = {};
  for (const k of KEYS) env[k] = describe(process.env[k]);
  return NextResponse.json({ ok: true, env, vercel: { region: process.env.VERCEL_REGION ?? null, env: process.env.VERCEL_ENV ?? null, url: process.env.VERCEL_URL ?? null } });
}
