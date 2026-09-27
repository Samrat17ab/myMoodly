'use client';

import { useEffect, useState } from 'react';
import { nextResetLocalLabel } from '@/app/lib/time';
import { BreathingMoment } from '../BreathingMoment';
import { IconBack } from '../Icons';
import { PageShell, type HeaderNav } from './PageShell';

export function LimitReached({ nav, limit, onBack }: { nav: HeaderNav; limit: number; onBack: () => void }) {
  // Safe default until the client corrects it to the viewer's timezone.
  const [resetLabel, setResetLabel] = useState('midnight');
  useEffect(() => {
    const readLocalReset = () => setResetLabel(nextResetLocalLabel());
    readLocalReset();
  }, []);

  return (
    <PageShell nav={nav}>
      <button type="button" className="mm-iconbtn mm-page__back" onClick={onBack} aria-label="Back">
        <IconBack />
      </button>
      <div className="mm-page__head">
        <h1 className="mm-display mm-display--lg">You&apos;ve used today&apos;s free connections.</h1>
        <p className="mm-lede">
          Everyone gets {limit} conversations a day. Yours will be back at {resetLabel} your time. In the meantime, this breathing moment is here whenever you want it.
        </p>
      </div>
      <BreathingMoment />
    </PageShell>
  );
}
