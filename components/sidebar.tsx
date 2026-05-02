'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Settings, Shield, LogOut } from 'lucide-react';
import { SpartanHelmet } from './spartan-helmet';
import { EyeIcon } from './eye-icon';
import type { Profile } from '@/types/database';

type Props = { profile: Profile };

const NAV = [
  { href: '/coach', label: 'Sales Coach', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ profile }: Props) {
  const pathname = usePathname();
  const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';

  return (
    <aside className="w-60 shrink-0 bg-panel border-r border-line flex flex-col h-screen">
      <div className="p-6 border-b border-line flex items-center gap-3">
        <SpartanHelmet className="w-9 h-9 text-gold" />
        <div>
          <h1 className="font-display text-xs tracking-widest uppercase text-gold">JK&R</h1>
          <p className="text-sm text-white font-semibold leading-tight">Sales Coach</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-gold/10 text-gold' : 'text-zinc-400 hover:bg-line hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname?.startsWith('/admin')
                ? 'bg-red-900/20 text-red-400'
                : 'text-zinc-400 hover:bg-line hover:text-white'
            }`}
          >
            <Shield size={18} />
            Admin
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-line bg-surface-2/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center text-gold font-bold uppercase">
            {profile.name?.charAt(0) || profile.email.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-white font-medium truncate flex items-center gap-1.5">
              {profile.is_anonymous ? 'Anonymous Rep' : profile.name || profile.email}
              {isAdmin && <EyeIcon size={14} className="text-gold shrink-0" />}
            </p>
            <p className="text-xs text-zinc-500 truncate capitalize">{profile.role}</p>
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
