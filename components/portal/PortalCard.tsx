'use client';

import { motion } from 'framer-motion';
import { SpartanHelmet } from '@/components/spartan-helmet';
import { reachedStage, usePortalEntrance, type PortalStage } from './usePortalEntrance';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Props = {
  children: React.ReactNode;
  stage?: PortalStage;
  reduced?: boolean;
};

export function PortalCard({ children, stage: stageOverride, reduced: reducedOverride }: Props) {
  const internal = usePortalEntrance();
  const stage = stageOverride ?? internal.stage;
  const reduced = reducedOverride ?? internal.reduced;

  return (
    <div
      className={`relative w-full max-w-[420px] ${reduced ? 'portal-reduced-motion' : ''}`}
    >
      {/* Card body */}
      <div className="bg-portal-bg pt-14 pb-14 px-12 max-[480px]:pt-12 max-[480px]:pb-12 max-[480px]:px-8">
        {/* Monogram */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={
            reachedStage(stage, 'monogram')
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 1.04 }
          }
          transition={{ duration: 0.6, ease: EASE }}
          className="flex justify-center"
        >
          <SpartanHelmet className="w-14 h-14 max-[480px]:w-12 max-[480px]:h-12 text-portal-gold" />
        </motion.div>

        {/* Hairline rule beneath monogram (draws from center outward) */}
        <div className="mt-6 flex justify-center">
          <motion.div
            initial={{ width: 0 }}
            animate={reachedStage(stage, 'rule') ? { width: 48 } : { width: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="h-px bg-portal-gold"
          />
        </div>

        {/* Wordmark */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={
            reachedStage(stage, 'wordmark')
              ? { opacity: 1, letterSpacing: '0.32em' }
              : { opacity: 0, letterSpacing: '0.5em' }
          }
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-6 text-center text-[22px] max-[480px]:text-[18px] font-portal-display font-medium uppercase text-portal-text"
          style={{ letterSpacing: '0.32em' }}
        >
          JK&amp;R PORTAL
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={reachedStage(stage, 'tagline') ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="mt-3 text-center text-[10px] font-portal text-portal-tertiary uppercase"
          style={{ letterSpacing: '0.32em' }}
        >
          ACCESS · TRAINING · EXECUTION
        </motion.p>

        {/* Authorized line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={reachedStage(stage, 'tagline') ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE, delay: 0.05 }}
          className="mt-4 text-center text-[12px] font-portal text-portal-tertiary"
          style={{ letterSpacing: '0.16em' }}
        >
          Authorized personnel only.
        </motion.p>

        {/* Children (form) */}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
