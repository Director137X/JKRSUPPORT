'use client';

import { ChevronRight } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
};

export function PortalButton({ children, type = 'button', disabled, onClick }: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="portal-button group w-full h-12 flex items-center justify-center gap-3 bg-portal-surface1 border border-portal-gold text-portal-gold font-portal font-semibold uppercase text-[13px] disabled:border-portal-tertiary disabled:text-portal-tertiary disabled:cursor-not-allowed"
      style={{ borderRadius: 0, letterSpacing: '0.24em' }}
    >
      <span>{children}</span>
      <ChevronRight size={14} className="portal-button-chevron" aria-hidden />
    </button>
  );
}
