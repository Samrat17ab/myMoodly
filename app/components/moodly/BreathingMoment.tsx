'use client';

import { useEffect, useState } from 'react';
import { Moodlight } from './Moodlight';

const BREATHS = 6;

/** The Moodlight breathing on a 4s in / 6s out rhythm, with an optional one-minute guide. */
export function BreathingMoment({ color = '#A9C9B4', className }: { color?: string; className?: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null) return;
    if (left === 0) {
      const t = window.setTimeout(() => setLeft(null), 5000);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setLeft((n) => (n === null ? null : n - 1)), 10_000);
    return () => window.clearTimeout(t);
  }, [left]);

  const text =
    left === null
      ? 'Follow the light for a few breaths before you check in. Nothing else to do.'
      : left === 0
        ? 'Nicely done. Carry that into your check-in.'
        : `Follow the light. In for four, out for six. ${left} ${left === 1 ? 'breath' : 'breaths'} to go.`;

  return (
    <section className={`mm-breathing mm-glass ${className ?? ''}`} aria-label="Breathing moment">
      <Moodlight color={color} size={160} className="mm-breathing__light" />
      <div className="mm-breathing__cue" aria-hidden="true">
        <span className="mm-cue-in">Breathe in</span>
        <span className="mm-cue-out">And slowly out</span>
      </div>
      <p className="mm-breathing__text" aria-live="polite">
        {text}
      </p>
      <button type="button" className="mm-btn mm-btn--quiet mm-btn--sm" onClick={() => setLeft(left === null ? BREATHS : null)}>
        {left === null ? 'Take one minute' : 'Stop'}
      </button>
    </section>
  );
}
