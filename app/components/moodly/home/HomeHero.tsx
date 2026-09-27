'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '../AppHeader';
import { BreathingMoment } from '../BreathingMoment';
import { SceneControls } from '../SceneControls';
import { Sanctuary } from '../sanctuary/Sanctuary';
import { ResetNote } from './ResetNote';

interface Props {
  initials: string;
  remaining: number;
  limit: number;
  onCheckIn: () => void;
  onHome: () => void;
  onGuide: () => void;
  onAccount: () => void;
}

function greeting(h: number) {
  if (h >= 5 && h < 12) return 'Good morning.';
  if (h >= 12 && h < 17) return 'Good afternoon.';
  if (h >= 17 && h < 22) return 'Good evening.';
  return 'Still up? That is okay.';
}

export function HomeHero({ initials, remaining, limit, onCheckIn, onHome, onGuide, onAccount }: Props) {
  const [hello, setHello] = useState<string | null>(null);
  // Read the clock after mount so server and client render the same markup.
  useEffect(() => {
    const readClock = () => setHello(greeting(new Date().getHours()));
    readClock();
  }, []);
  const out = remaining <= 0;

  return (
    <div className="mm-home">
      <Sanctuary mode="full" />
      <div className="mm-home__scrim" aria-hidden="true" />
      <AppHeader initials={initials} onHome={onHome} onGuide={onGuide} onAccount={onAccount} />
      <main className="mm-home__main">
        <div className="mm-home__copy">
          <p className="mm-home__hello mm-rise">{hello ?? ' '}</p>
          <h1 className="mm-display mm-display--xl mm-rise mm-d1">How are you, really?</h1>
          <p className="mm-lede mm-rise mm-d2">Take a breath first. Then name what you&apos;re feeling and meet someone who can meet you there.</p>
          <div className="mm-home__cta mm-rise mm-d3">
            <button type="button" className="mm-btn mm-btn--primary" onClick={onCheckIn} disabled={out}>
              Start a check-in
            </button>
            <ResetNote remaining={remaining} limit={limit} />
          </div>
        </div>
        <BreathingMoment className="mm-home__breath mm-rise mm-d4" />
      </main>
      <div className="mm-home__footer">
        <SceneControls />
      </div>
    </div>
  );
}
