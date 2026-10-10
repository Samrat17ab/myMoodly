'use client';

import { useEffect, useState } from 'react';
import { AppHeader } from '../AppHeader';
import { BreathingMoment } from '../BreathingMoment';
import { SceneControls } from '../SceneControls';
import { Sanctuary } from '../sanctuary/Sanctuary';
import { ResetNote } from './ResetNote';
import { NightCountdown } from '../openHours/NightCountdown';
import type { LiveOpenHours } from '../openHours/useOpenHours';
import { NIGHT_HOURS_ENABLED } from '@/app/lib/openHours';

interface Props {
  initials: string;
  remaining: number;
  limit: number;
  onCheckIn: () => void;
  /** nightly opening hours; null until the clock is read */
  hours?: LiveOpenHours | null;
  /** admins can check in outside opening hours, to test */
  isAdmin?: boolean;
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

export function HomeHero({ initials, remaining, limit, onCheckIn, hours, isAdmin, onHome, onGuide, onAccount }: Props) {
  const [hello, setHello] = useState<string | null>(null);
  // Read the clock after mount so server and client render the same markup.
  useEffect(() => {
    const readClock = () => setHello(greeting(new Date().getHours()));
    readClock();
  }, []);
  const out = remaining <= 0;
  const nightly = Boolean(hours?.enabled);
  const closed = Boolean(hours && !hours.open);

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
          {NIGHT_HOURS_ENABLED && !hours ? (
            // Reading the clock: hold the space so nothing jumps.
            <div className="mm-home__cta" style={{ minHeight: 96 }} />
          ) : closed && !isAdmin && hours ? (
            <div className="mm-home__closed mm-rise mm-d3">
              <NightCountdown hours={hours} variant="card" />
            </div>
          ) : (
            <div className="mm-home__cta mm-rise mm-d3">
              <button type="button" className="mm-btn mm-btn--primary" onClick={onCheckIn} disabled={out}>
                Start a check-in
              </button>
              <ResetNote remaining={remaining} limit={limit} />
              {nightly && hours?.open && (
                <p className="mm-home__testmode">
                  <span className="mm-night__pulse" aria-hidden="true" style={{ display: 'inline-block', marginRight: 8 }} />
                  We&apos;re open until 3 AM IST
                </p>
              )}
              {closed && isAdmin && (
                <p className="mm-home__testmode">Test mode: outside opening hours you&apos;ll only be matched with another admin.</p>
              )}
            </div>
          )}
        </div>
        <BreathingMoment className="mm-home__breath mm-rise mm-d4" />
      </main>
      <div className="mm-home__footer">
        <SceneControls />
      </div>
    </div>
  );
}
