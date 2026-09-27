'use client';

import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { deepColor } from './lib/mood';

interface Props {
  color: string;
  size?: number;
  breathing?: boolean;
  halo?: boolean;
  /** an expanding ring, used on the mood map to say "this is draggable" */
  pulse?: boolean;
  /** share across steps so the light visibly travels (framer-motion shared layout) */
  layoutId?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The Moodlight: the user's companion through the whole journey.
 * Breathes on a 10s cycle (4s in, 6s out). Colour comes from the mood.
 * Rendered as spans so it is valid inside buttons.
 */
export function Moodlight({ color, size = 72, breathing = true, halo = true, pulse = false, layoutId, className, style }: Props) {
  const vars = {
    '--mm-light': color,
    '--mm-light-deep': deepColor(color),
    '--mm-light-size': `${size}px`,
  } as CSSProperties;
  return (
    <motion.span
      layoutId={layoutId}
      className={['mm-moodlight', breathing ? 'is-breathing' : '', className ?? ''].filter(Boolean).join(' ')}
      style={{ ...vars, ...style }}
      aria-hidden="true"
    >
      {pulse && <span className="mm-moodlight__pulse" />}
      {halo && <span className="mm-moodlight__halo" />}
      <span className="mm-moodlight__core" />
    </motion.span>
  );
}
