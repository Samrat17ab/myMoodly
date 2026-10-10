'use client';

import { useEffect, useState } from 'react';
import { NIGHT_HOURS_ENABLED, openHoursState, type OpenHoursState } from '@/app/lib/openHours';

export interface LiveOpenHours extends OpenHoursState {
  /** the corrected current time (server clock), epoch ms */
  now: number;
}

const RESYNC_MS = 10 * 60_000;

/**
 * Live opening state, ticking every second. Corrected to the server's clock,
 * so a visitor whose device clock is wrong still sees the right countdown.
 * Returns null until mounted, keeping server and client markup identical.
 */
export function useOpenHours(): LiveOpenHours | null {
  const [state, setState] = useState<LiveOpenHours | null>(null);

  useEffect(() => {
    let offset = 0;
    let alive = true;
    const tick = () => {
      const now = Date.now() + offset;
      setState({ ...openHoursState(now), now });
    };
    const sync = async () => {
      if (!NIGHT_HOURS_ENABLED) return;
      try {
        const sent = Date.now();
        const res = await fetch('/api/hours', { cache: 'no-store' });
        const data = (await res.json()) as { now?: number };
        const received = Date.now();
        // Half the round trip approximates when the server read its clock.
        if (alive && typeof data.now === 'number') offset = data.now - (sent + received) / 2;
      } catch {
        // Keep the device clock; the countdown is still close.
      }
      if (alive) tick();
    };

    tick();
    void sync();
    const second = window.setInterval(tick, 1000);
    const resync = window.setInterval(() => void sync(), RESYNC_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.clearInterval(second);
      window.clearInterval(resync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return state;
}
