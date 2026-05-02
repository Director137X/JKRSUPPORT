import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth';
import { MembersGrid } from './members-grid';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('profiles')
    .select('id,name,email,role,position')
    .eq('id', user.id)
    .maybeSingle() as any;

  const isSuper = me?.role === 'superadmin' || isSuperadminEmail(me?.email ?? user.email);

  const { data: members } = await supabase
    .from('profiles')
    .select('id,name,email,role,position,is_anonymous,created_at')
    .order('created_at', { ascending: false }) as any;

  return <MembersGrid members={(members ?? []) as any[]} meId={user.id} isSuper={isSuper} />;
}
