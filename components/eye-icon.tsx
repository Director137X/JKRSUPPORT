type Props = { className?: string; size?: number };

export function EyeIcon({ className = 'text-gold', size = 16 }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} className={className} aria-hidden>
      <path d="M12 3 L22 21 L2 21 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="12" cy="15.5" rx="4.5" ry="2.8" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
      <path d="M9 17l-1 1.4M15 17l1 1.4M12 18.6v1.6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}
