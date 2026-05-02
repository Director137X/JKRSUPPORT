import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { COACH_MODEL } from '@/lib/anthropic';
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

  const key = process.env.ANTHROPIC_API_KEY ?? '';
  const model = COACH_MODEL;
  const sdkVersion = (Anthropic as any).VERSION ?? 'unknown';

  const keyMeta = {
    set: !!key,
    length: key.length,
    starts_with_sk_ant: key.startsWith('sk-ant-'),
    has_trailing_whitespace: key !== key.trim(),
    last4: key.length > 4 ? key.slice(-4) : null,
    first8: key.length > 8 ? key.slice(0, 8) : null,
  };

  if (!key) {
    return NextResponse.json({
      ok: false,
      where: 'env',
      reason: 'ANTHROPIC_API_KEY is not set on this deployment.',
      keyMeta,
      model,
      sdkVersion,
    });
  }

  const client = new Anthropic({ apiKey: key.trim() });

  try {
    const t0 = Date.now();
    const res = await client.messages.create({
      model,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Say "ok" and nothing else.' }],
    });
    const ms = Date.now() - t0;
    const text =
      res.content[0]?.type === 'text' ? res.content[0].text : JSON.stringify(res.content[0]);
    return NextResponse.json({
      ok: true,
      latency_ms: ms,
      model_used: res.model,
      reply: text,
      keyMeta,
      sdkVersion,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      where: 'anthropic',
      name: err?.name ?? 'unknown',
      status: err?.status ?? null,
      message: err?.message ?? String(err),
      cause: err?.cause ? String(err.cause) : null,
      headers: err?.headers ?? null,
      keyMeta,
      model,
      sdkVersion,
    }, { status: 200 });
  }
}
