import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser() as any;
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');

  return (
    <div className="h-full overflow-y-auto px-8 py-10 scrollbar-thin">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-2xl tracking-wide text-white">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your profile, anonymity, and admin access.</p>
        </header>
        <SettingsForm profile={profile} />
      </div>
    </div>
  );
}
