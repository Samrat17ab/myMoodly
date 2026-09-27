'use client';

import { useState } from 'react';
import { MoodMap } from '../MoodMap';
import { Stars } from '../sanctuary/Stars';
import { describeMood, moodColor, type MoodPoint } from '../lib/mood';

/** Landing section: visitors can try the mood map without an account. */
export function TryMoodMap({ onSignIn }: { onSignIn: () => void }) {
  const [p, setP] = useState<MoodPoint>({ x: 0.72, y: 0.7 });
  const d = describeMood(p);
  return (
    <section className="mm-try" data-tone="dark">
      <Stars count={46} seed={7} maxY={100} />
      <div className="mm-try__copy">
        <h2 className="mm-display mm-display--lg">Try it. No account needed.</h2>
        <p className="mm-body">Tap anywhere on the map. Up means more energy, right means it feels better. Your light changes with you.</p>
        <div className="mm-try__reading" aria-live="polite">
          <span className="mm-try__eyebrow">Right now you seem</span>
          <span className="mm-try__label" style={{ color: moodColor(p) }}>
            {d.label}
          </span>
          <span className="mm-try__hint">{d.hint}</span>
        </div>
        <button type="button" className="mm-btn mm-btn--primary" onClick={onSignIn}>
          Check in for real
        </button>
      </div>
      <MoodMap value={p} onChange={setP} tone="dark" size="md" showZones={false} className="mm-try__map" label="Try the mood map" />
    </section>
  );
}
