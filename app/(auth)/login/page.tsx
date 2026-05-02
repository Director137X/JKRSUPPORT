'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { PortalCard } from '@/components/portal/PortalCard';
import { PortalField } from '@/components/portal/PortalField';
import { PortalButton } from '@/components/portal/PortalButton';
import {
  reachedStage,
  usePortalEntrance,
} from '@/components/portal/usePortalEntrance';
import { isPreApprovedAdmin } from '@/lib/auth';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
type Mode = 'signin' | 'signup';
type Position = 'closer' | 'setter' | 'admin';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { stage, reduced } = usePortalEntrance();

  const [mode, setMode] = useState<Mode>(
    searchParams?.get('mode') === 'signup' ? 'signup' : 'signin',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState<Position>('closer');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push('/coach');
      router.refresh();
      return;
    }

    const skipCode = position === 'admin' && isPreApprovedAdmin(email);
    if (position === 'admin' && !skipCode && adminCode.trim().length < 4) {
      setLoading(false);
      setError('Admin invite code is required.');
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, position },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (data.user && !data.session) {
      setLoading(false);
      setInfo(
        position === 'admin'
          ? 'Check your inbox to confirm. Sign in, then redeem your admin code in Settings.'
          : 'Check your inbox to confirm your account, then return to sign in.',
      );
      return;
    }

    if (data.session && position === 'admin') {
      const res = await fetch('/api/auth/redeem-admin-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: skipCode ? '' : adminCode.trim() }),
      });
      setLoading(false);
      if (!res.ok) {
        const { error: detail } = await res.json().catch(() => ({ error: 'Code rejected' }));
        setError(detail || 'Code rejected — sign in and redeem in Settings.');
        return;
      }
      window.location.href = '/coach';
      return;
    }

    setLoading(false);
    if (data.session) {
      window.location.href = '/coach';
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Auth mode toggle — sits ABOVE the card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={reachedStage(stage, 'wordmark') ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="mb-10 flex items-center gap-4 text-[11px] font-portal font-medium uppercase"
        style={{ letterSpacing: '0.24em' }}
        role="tablist"
      >
        <ToggleLink
          active={mode === 'signin'}
          onClick={() => {
            setMode('signin');
            setError(null);
            setInfo(null);
          }}
        >
          Sign In
        </ToggleLink>
        <span className="h-3 w-px bg-portal-hairline" aria-hidden />
        <ToggleLink
          active={mode === 'signup'}
          onClick={() => {
            setMode('signup');
            setError(null);
            setInfo(null);
          }}
        >
          Create Account
        </ToggleLink>
      </motion.div>

      <PortalCard stage={stage} reduced={reduced}>
        <form onSubmit={onSubmit} className="space-y-8" noValidate>
          {info && (
            <p className="text-[12px] font-portal text-portal-success" role="status">
              {info}
            </p>
          )}

          {mode === 'signup' && (
            <FieldFade stage={stage} index={0}>
              <PortalField
                label="OPERATOR NAME"
                placeholder="First Last"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FieldFade>
          )}

          <FieldFade stage={stage} index={mode === 'signup' ? 1 : 0}>
            <PortalField
              label="WORK EMAIL"
              type="email"
              placeholder="name@jkrconstruction.com"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldFade>

          <FieldFade stage={stage} index={mode === 'signup' ? 2 : 1}>
            <PortalField
              label="PASSWORD"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 8 : undefined}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />
          </FieldFade>

          {mode === 'signup' && (
            <FieldFade stage={stage} index={3}>
              <RolePicker value={position} onChange={setPosition} />
            </FieldFade>
          )}

          {mode === 'signup' && position === 'admin' && !isPreApprovedAdmin(email) && (
            <FieldFade stage={stage} index={4}>
              <PortalField
                label="ADMIN INVITE CODE"
                placeholder="Issued by an admin"
                autoComplete="off"
                required
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
              />
            </FieldFade>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={reachedStage(stage, 'button') ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <PortalButton type="submit" disabled={loading}>
              {loading
                ? mode === 'signin'
                  ? 'AUTHENTICATING'
                  : 'CREATING'
                : mode === 'signin'
                ? 'ENTER PORTAL'
                : 'CREATE ACCOUNT'}
            </PortalButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={reachedStage(stage, 'button') ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.1 }}
            className="text-center text-[10px] font-portal text-portal-tertiary"
            style={{ letterSpacing: '0.04em' }}
          >
            By entering, you accept the JK&amp;R Conduct &amp; Confidentiality Code.
          </motion.p>
        </form>
      </PortalCard>
    </div>
  );
}

function FieldFade({
  children,
  stage,
  index,
}: {
  children: React.ReactNode;
  stage: ReturnType<typeof usePortalEntrance>['stage'];
  index: number;
}) {
  const visible = reachedStage(stage, 'fields');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.4, ease: EASE, delay: index * 0.08 }}
    >
      {children}
    </motion.div>
  );
}

function ToggleLink({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className="relative pb-2"
      style={{ letterSpacing: '0.24em' }}
    >
      <span className={active ? 'text-portal-text' : 'text-portal-tertiary'}>
        {children}
      </span>
      {active && (
        <motion.span
          layoutId="portal-toggle-rule"
          className="absolute left-1/2 -translate-x-1/2 bottom-0 h-px w-6 bg-portal-gold"
          transition={{ duration: 0.28, ease: EASE }}
        />
      )}
    </button>
  );
}

function RolePicker({
  value,
  onChange,
}: {
  value: Position;
  onChange: (v: Position) => void;
}) {
  const opts: { v: Position; label: string; desc: string }[] = [
    { v: 'closer', label: 'CLOSER', desc: 'Direct access. No code required.' },
    { v: 'setter', label: 'SETTER', desc: 'Direct access. No code required.' },
    { v: 'admin', label: 'ADMIN', desc: 'Requires an invite code.' },
  ];
  return (
    <div className="flex flex-col">
      <span
        className="text-[11px] font-portal font-medium uppercase text-portal-tertiary"
        style={{ letterSpacing: '0.18em' }}
      >
        ROLE
      </span>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {opts.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              aria-pressed={active}
              className={`px-3 py-3 text-[11px] font-portal font-semibold transition-colors ${
                active
                  ? 'bg-portal-gold/10 text-portal-gold border border-portal-gold'
                  : 'bg-transparent text-portal-tertiary border border-portal-hairline hover:text-portal-text'
              }`}
              style={{ letterSpacing: '0.24em', borderRadius: 0 }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] font-portal text-portal-tertiary" style={{ letterSpacing: '0.04em' }}>
        {opts.find((o) => o.v === value)?.desc}
      </p>
    </div>
  );
}
