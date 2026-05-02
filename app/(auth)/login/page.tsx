'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SpartanHelmet } from '@/components/spartan-helmet';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/coach');
    router.refresh();
  };

  return (
    <div className="bg-surface/90 backdrop-blur border border-line rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
      <div className="p-8 text-center border-b border-line bg-surface-2/80">
        <SpartanHelmet className="w-14 h-14 text-gold mx-auto mb-4 drop-shadow-md" />
        <h1 className="font-display text-2xl tracking-widest uppercase text-white">JK&R Portal</h1>
        <p className="text-sm text-zinc-400 mt-2">Sign in to the JK&R Sales Coach.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/40 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-line rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-line rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-black font-bold uppercase tracking-wider py-3.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Enter Portal'}
        </button>
        <p className="text-center text-sm text-zinc-500">
          New rep?{' '}
          <Link href="/signup" className="text-gold hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
