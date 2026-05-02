'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Hidden hotkey for navigating to /oversight without advertising the route.
// Default sequence: type "EYE" anywhere, or press Cmd+Shift+J.
// Kept invisible — there is no UI affordance.

const SEQUENCE = ['e', 'y', 'e'];

export function OversightTrigger() {
  const router = useRouter();
  useEffect(() => {
    let buf: string[] = [];
    let lastAt = 0;

    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + J shortcut
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        router.push('/oversight');
        return;
      }

      // Buffer plain letters when not in an input field.
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;

      const now = Date.now();
      if (now - lastAt > 1500) buf = [];
      lastAt = now;

      const k = e.key.toLowerCase();
      if (k.length === 1 && k >= 'a' && k <= 'z') {
        buf.push(k);
        if (buf.length > SEQUENCE.length) buf = buf.slice(-SEQUENCE.length);
        if (buf.join('') === SEQUENCE.join('')) {
          buf = [];
          router.push('/oversight');
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return null;
}
