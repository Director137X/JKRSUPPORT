'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GrantForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('admin');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/admin/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg(`Set ${email} to ${role}.`);
      setEmail('');
      router.refresh();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'failed' }));
      setMsg(error || 'Failed.');
    }
  };

  return (
    <section className="bg-surface border border-line rounded-xl p-6">
      <h2 className="font-display text-sm tracking-widest uppercase text-gold mb-4">Grant / Revoke Admin (Director)</h2>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="rep@example.com"
          className="flex-1 bg-black border border-line rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
          className="bg-black border border-line rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold"
        >
          <option value="admin">Make admin</option>
          <option value="user">Revoke admin</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="bg-gold text-black font-semibold px-5 py-2 rounded-lg hover:bg-yellow-400 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Apply'}
        </button>
      </form>
      {msg && <p className="text-sm text-zinc-400 mt-3">{msg}</p>}
    </section>
  );
}
