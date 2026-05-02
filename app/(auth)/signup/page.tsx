'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SpartanHelmet } from '@/components/spartan-helmet';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user && !data.session) {
      setInfo('Check your email to confirm your account, then come back and log in.');
    } else if (data.session) {
      window.location.href = '/coach';
    }
  };

  return (
    <div className="bg-surface/90 backdrop-blur border border-line rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
      <div className="p-8 text-center border-b border-line bg-surface-2/80">
        <SpartanHelmet className="w-14 h-14 text-gold mx-auto mb-4 drop-shadow-md" />
        <h1 className="font-display text-2xl tracking-widest uppercase text-white">Join the Portal</h1>
        <p className="text-sm text-zinc-400 mt-2">Create your JK&R Sales Coach account.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/40 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="p-3 bg-green-900/20 border border-green-700/40 rounded text-green-200 text-sm">
            {info}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black border border-line rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold"
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-line rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold"
          />
          <p className="text-xs text-zinc-500 mt-1">8+ characters.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-black font-bold uppercase tracking-wider py-3.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
