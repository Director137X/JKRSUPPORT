'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, ShieldCheck, BookOpen, Shield, Settings, LogOut, UsersRound, type LucideIcon } from 'lucide-react';
import { SpartanHelmet } from './spartan-helmet';
import { EyeIcon } from './eye-icon';
import { MasonicEye } from './masonic-eye';
import { OversightTrigger } from './oversight-trigger';
import type { Profile } from '@/types/database';
import { isSuperadminEmail } from '@/lib/auth';

type Props = { profile: Profile };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  eyebrow?: boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: '/support-circle', label: 'SUPPORT CIRCLE', icon: Users, eyebrow: true },
  { href: '/members',        label: 'MEMBERS',        icon: UsersRound, eyebrow: true },
  { href: '/admin',          label: 'ADMIN',          icon: ShieldCheck, eyebrow: true, adminOnly: true },
  { href: '/training',       label: 'TRAINING',       icon: BookOpen, eyebrow: true },
  { href: '/coach',          label: 'SPARTAN AI',     icon: Shield, eyebrow: true },
  { href: '/settings',       label: 'SETTINGS',       icon: Settings, eyebrow: true },
];

export function Sidebar({ profile }: Props) {
  const pathname = usePathname();
  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';
  const isSuper = profile.role === 'superadmin' || isSuperadminEmail(profile.email);

  return (
    <aside className="w-60 shrink-0 bg-panel border-r border-line flex flex-col h-screen">
      <div className="p-6 border-b border-line flex items-center gap-3">
        <SpartanHelmet className="w-9 h-9 text-gold" />
        <div>
          <h1 className="font-display text-xs tracking-widest uppercase text-gold">JK&R</h1>
          <p className="text-sm text-white font-semibold leading-tight">Support Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV.map(({ href, label, icon: Icon, adminOnly }) => {
          if (adminOnly && !isAdmin) return null;
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors uppercase ${
                active ? 'bg-gold/10 text-gold' : 'text-zinc-400 hover:bg-line hover:text-white'
              }`}
              style={{
                fontFamily: 'var(--font-barlow), sans-serif',
                letterSpacing: '0.18em',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Director-only gold tab — no role label, only the eye + "Oversight".
          Only the Director sees their own sidebar, so this is invisible to
          everyone else by definition. The hidden hotkey (Cmd+Shift+J / type
          "EYE") stays available as a backup. */}
      {isSuper && <OversightTrigger />}
      {isSuper && (
        <Link
          href="/oversight"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '0 12px 10px',
            padding: '10px 14px',
            borderRadius: '0',
            border: '1px solid #C9A961',
            background: pathname?.startsWith('/oversight')
              ? 'linear-gradient(180deg, #C9A961 0%, #A88742 100%)'
              : 'linear-gradient(180deg, rgba(201,169,97,0.12) 0%, rgba(201,169,97,0.04) 100%)',
            color: pathname?.startsWith('/oversight') ? '#000' : '#F5C84B',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            transition: 'background 200ms ease, color 200ms ease',
          }}
        >
          <MasonicEye size={18} className="shrink-0" />
          <span style={{ flex: 1 }}>Oversight</span>
        </Link>
      )}

      <div className="p-4 border-t border-line bg-surface-2/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center text-gold font-bold uppercase">
            {profile.name?.charAt(0) || profile.email.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-white font-medium truncate flex items-center gap-1.5">
              {profile.is_anonymous ? 'Anonymous Rep' : profile.name || profile.email}
            </p>
            <p className="text-xs text-zinc-500 truncate capitalize">
              {/* Visible label hides any privileged role.
                  - 'user' → show position (closer/setter) or 'Member'
                  - 'admin' → show 'Admin'
                  - 'superadmin' → still appear as 'Member' externally */}
              {profile.role === 'admin'
                ? 'Admin'
                : profile.position ?? 'Member'}
            </p>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-white py-2 rounded border border-line hover:bg-line"
          >
            <LogOut size={14} /> Log Out
          </button>
        </form>
      </div>
    </aside>
  );
}
