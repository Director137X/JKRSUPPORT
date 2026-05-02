import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { SupportCircle } from './support-circle';

export const dynamic = 'force-dynamic';

export default async function SupportCirclePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,name,email,role,is_anonymous')
    .eq('id', user.id)
    .single() as any;
  if (!profile) redirect('/login');

  return <SupportCircle profile={profile} />;
}
