import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AdminChat } from './admin-chat';

export const dynamic = 'force-dynamic';

export default async function AdminChatPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('profiles')
    .select('id,name,email,role')
    .eq('id', user.id)
    .single() as any;
  if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) redirect('/coach');

  return <AdminChat profile={me} />;
}
