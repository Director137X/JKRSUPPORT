'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(profile.name ?? '');
  const [isAnonymous, setIsAnonymous] = useState(profile.is_anonymous);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [inviteKey, setInviteKey] = useState('');
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const [requesting, setRequesting] = useState(false);
  const [requestMsg, setRequestMsg] = useState<string | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ name, is_anonymous: isAnonymous })
      .eq('id', profile.id);
    setSavingProfile(false);
    setProfileMsg(error ? error.message : 'Saved.');
    router.refresh();
  };

  const redeemKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeeming(true);
    setRedeemMsg(null);
    const res = await fetch('/api/admin/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: inviteKey }),
    });
    setRedeeming(false);
    if (res.ok) {
      setRedeemMsg('You are now an admin. Refreshing…');
      setInviteKey('');
      router.refresh();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'failed' }));
      setRedeemMsg(error || 'Failed to redeem key.');
    }
  };

  const requestAdmin = async () => {
    setRequesting(true);
    setRequestMsg(null);
    const res = await fetch('/api/admin/request', { method: 'POST' });
    setRequesting(false);
    if (res.ok) {
      setRequestMsg('Request sent. Check back once HQ replies with the invite key.');
    } else {
      const { error } = await res.json().catch(() => ({ error: 'failed' }));
      setRequestMsg(error || 'Failed to send request.');
    }
  };

  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';

  return (
    <div className="space-y-8">
      <section className="bg-surface border border-line rounded-xl p-6">
        <h2 className="font-display text-sm tracking-widest uppercase text-gold mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-line rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold"
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-gold w-4 h-4"
            />
            Show me as &quot;Anonymous Rep&quot; to admins
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="bg-gold text-black font-semibold px-5 py-2 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
            >
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
            {profileMsg && <span className="text-sm text-zinc-400">{profileMsg}</span>}
          </div>
        </form>
      </section>

      {!isAdmin && (
        <section className="bg-surface border border-line rounded-xl p-6">
          <h2 className="font-display text-sm tracking-widest uppercase text-gold mb-4">Admin Access</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Request admin access from HQ. They&apos;ll email you the invite key — paste it below to be promoted.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              type="button"
              onClick={requestAdmin}
              disabled={requesting}
              className="bg-line text-white font-semibold px-5 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50"
            >
              {requesting ? 'Sending…' : 'Request Admin Access'}
            </button>
            {requestMsg && <span className="text-sm text-zinc-400 self-center">{requestMsg}</span>}
          </div>

          <form onSubmit={redeemKey} className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invite key</label>
            <div className="flex gap-3">
              <input
                type="password"
                value={inviteKey}
                onChange={(e) => setInviteKey(e.target.value)}
                placeholder="Paste invite key…"
                className="flex-1 bg-black border border-gold/40 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={redeeming || !inviteKey}
                className="bg-gold text-black font-semibold px-5 py-2 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
              >
                {redeeming ? 'Redeeming…' : 'Redeem'}
              </button>
            </div>
            {redeemMsg && <p className="text-sm text-zinc-400">{redeemMsg}</p>}
          </form>
        </section>
      )}

      {isAdmin && (
        <section className="bg-surface border border-line rounded-xl p-6">
          <h2 className="font-display text-sm tracking-widest uppercase text-gold mb-4">Admin Status</h2>
          <p className="text-sm text-zinc-300">
            You are currently <span className="text-gold font-semibold capitalize">{profile.role}</span>.
          </p>
        </section>
      )}
    </div>
  );
}
