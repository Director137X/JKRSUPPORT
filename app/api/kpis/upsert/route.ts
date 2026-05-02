import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  recorded_for?: string;
  tod_minutes?: number;
  dmc?: number;
  odm?: number;
  ubc?: number;
  sfc?: number;
  signed?: number;
  sold?: number;
  notes?: string | null;
};

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const b = (await req.json().catch(() => ({}))) as Body;
  const today = new Date().toISOString().slice(0, 10);

  const row = {
    user_id: user.id,
    recorded_for: b.recorded_for ?? today,
    tod_minutes: clamp(b.tod_minutes),
    dmc: clamp(b.dmc),
    odm: clamp(b.odm),
    ubc: clamp(b.ubc),
    sfc: clamp(b.sfc),
    signed: clamp(b.signed),
    sold: clamp(b.sold),
    notes: typeof b.notes === 'string' ? b.notes.slice(0, 2000) : null,
  };

  const { error } = await supabase
    .from('kpis')
    .upsert(row, { onConflict: 'user_id,recorded_for' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function clamp(n: unknown): number {
  const v = typeof n === 'number' ? n : parseInt(String(n ?? 0), 10);
  if (Number.isNaN(v) || v < 0) return 0;
  if (v > 100000) return 100000;
  return Math.floor(v);
}
