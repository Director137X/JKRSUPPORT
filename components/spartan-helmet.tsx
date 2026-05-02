type Props = { className?: string };

export function SpartanHelmet({ className = 'w-9 h-9' }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2C8.5 2 6 4.5 6 9v3c0 2.5 1.5 4 3 5l1 3h4l1-3c1.5-1 3-2.5 3-5V9c0-4.5-2.5-7-6-7z" />
      <path d="M12 2v7" />
      <path d="M9 10h6" />
      <path d="M12 12v3" />
      <path d="M8 12c1.5 1 3 1.5 4 1.5s2.5-.5 4-1.5" />
    </svg>
  );
}
