import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { KpiClient } from './kpi-client';
import type { KPI } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function KpiPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: todayRow }, { data: recent }] = await Promise.all([
    supabase
      .from('kpis')
      .select('*')
      .eq('user_id', user.id)
      .eq('recorded_for', today)
      .maybeSingle(),
    supabase
      .from('kpis')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_for', { ascending: false })
      .limit(14),
  ]);

  return <KpiClient today={(todayRow as KPI | null) ?? null} recent={(recent as KPI[] | null) ?? []} />;
}
