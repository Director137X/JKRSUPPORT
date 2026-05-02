type Props = { className?: string; size?: number };

export function MasonicEye({ className = '', size = 18 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3 L21.5 20.5 L2.5 20.5 Z" />
      <path d="M12 3 L12 6.5" opacity="0.5" />
      <path d="M5.2 13.2 C 7.5 10.8, 16.5 10.8, 18.8 13.2 C 16.5 15.6, 7.5 15.6, 5.2 13.2 Z" fill="currentColor" fillOpacity="0.08" />
      <circle cx="12" cy="13.2" r="2.1" fill="currentColor" fillOpacity="0.85" stroke="none" />
      <circle cx="12" cy="13.2" r="0.7" fill="#000" stroke="none" />
      <path d="M3.5 19 L20.5 19" opacity="0.6" />
    </svg>
  );
}
