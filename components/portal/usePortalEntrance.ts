'use client';

import { useEffect, useState } from 'react';

export type PortalStage =
  | 'idle'
  | 'monogram'
  | 'rule'
  | 'wordmark'
  | 'tagline'
  | 'fields'
  | 'button'
  | 'done';

const TIMELINE: { stage: PortalStage; at: number }[] = [
  { stage: 'monogram', at: 200 },
  { stage: 'rule', at: 700 },
  { stage: 'wordmark', at: 1000 },
  { stage: 'tagline', at: 1300 },
  { stage: 'fields', at: 1500 },
  { stage: 'button', at: 1900 },
  { stage: 'done', at: 2400 },
];

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function usePortalEntrance(): { stage: PortalStage; reduced: boolean } {
  const reduced = typeof window !== 'undefined' ? prefersReducedMotion() : false;
  const [stage, setStage] = useState<PortalStage>(reduced ? 'done' : 'idle');

  useEffect(() => {
    if (reduced) {
      setStage('done');
      return;
    }
    const timers = TIMELINE.map(({ stage: s, at }) =>
      window.setTimeout(() => setStage(s), at),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [reduced]);

  return { stage, reduced };
}

export function reachedStage(current: PortalStage, target: PortalStage): boolean {
  const order: PortalStage[] = [
    'idle',
    'monogram',
    'rule',
    'wordmark',
    'tagline',
    'fields',
    'button',
    'done',
  ];
  return order.indexOf(current) >= order.indexOf(target);
}
