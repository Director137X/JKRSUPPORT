'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { SpartanHelmet } from './spartan-helmet';
import type { Profile } from '@/types/database';

type Props = {
  profile: Profile;
  unreadDms: number;
  children: React.ReactNode;
};

export function AppShell({ profile, unreadDms, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="flex h-[100dvh] bg-black text-zinc-300 overflow-hidden">
      {/* Mobile top bar — only visible on small screens */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-panel border-b border-line flex items-center px-3 gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-gold"
        >
          <Menu size={20} />
        </button>
        <SpartanHelmet className="w-7 h-7 text-gold" />
        <div className="leading-tight">
          <div className="text-[10px] tracking-[0.2em] uppercase text-gold">JK&amp;R</div>
          <div className="text-[12px] text-white font-semibold">Support Portal</div>
        </div>
        {unreadDms > 0 && (
          <span
            className="ml-auto"
            style={{
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 999,
              background: '#B84A3F',
              color: '#FFF',
              fontSize: 10,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={`${unreadDms} unread`}
          >
            {unreadDms > 99 ? '99+' : unreadDms}
          </span>
        )}
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — drawer on mobile, fixed column on desktop */}
      <aside
        className={`md:static md:translate-x-0 fixed top-0 left-0 z-50 h-[100dvh] transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full">
          {/* Close button — only visible while drawer is open on mobile */}
          {open && (
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="md:hidden absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
          <Sidebar profile={profile} unreadDms={unreadDms} />
        </div>
      </aside>

      <main className="flex-1 overflow-hidden pt-14 md:pt-0">{children}</main>
    </div>
  );
}
