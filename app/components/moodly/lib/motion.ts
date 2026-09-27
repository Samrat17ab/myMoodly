import type { Variants } from 'framer-motion';

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const softSpring = { type: 'spring' as const, stiffness: 120, damping: 22, mass: 1 };

/** Step transitions: drift in the direction of travel, reversed on back. */
export const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE_OUT } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40, filter: 'blur(6px)', transition: { duration: 0.45, ease: EASE_OUT } }),
};

export const bubbleIn = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.55, ease: EASE_OUT },
};
