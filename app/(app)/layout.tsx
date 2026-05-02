import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { createServerClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  return (
    <div className="flex h-screen bg-black text-zinc-300">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
