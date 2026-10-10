'use client';

import { NIGHT_HOURS_ENABLED } from '@/app/lib/openHours';
import { IconBack } from '../Icons';
import { PageShell, type HeaderNav } from './PageShell';

const STEPS: [string, string][] = [
  ['Place your light', 'Tap where you are on the mood map, then pick the one word that fits best.'],
  ['Choose who you meet', 'Someone who feels close to how you do, or someone in a different headspace.'],
  ['Meet anonymously', "You're matched by mood and shared language, never by country, age or gender."],
  ['Talk for 20 minutes', 'A quiet timer keeps things contained. Keep going only if you both want to.'],
  ['Stay in control', 'Report or block at any time. Help is always one tap away.'],
];

export function Guide({ nav, onBack, onLogo }: { nav: HeaderNav | null; onBack: () => void; onLogo: () => void }) {
  return (
    <PageShell nav={nav} onLogo={onLogo} wide>
      <button type="button" className="mm-iconbtn mm-page__back" onClick={onBack} aria-label="Back">
        <IconBack />
      </button>
      <div className="mm-page__head">
        <h1 className="mm-display mm-display--lg">A small check-in. A real human moment.</h1>
        <p className="mm-lede">How myMoodly works, from the first breath to saying goodbye.</p>
      </div>
      <ol className="mm-guide__steps">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="mm-guide__step">
            <span className="mm-guide__num" aria-hidden="true">
              {i + 1}
            </span>
            <h2 className="mm-guide__title">{title}</h2>
            <p className="mm-body">{text}</p>
          </li>
        ))}
      </ol>
      <p className="mm-fine">
        {NIGHT_HOURS_ENABLED ? 'Open every night, 9 PM – 3 AM IST. ' : ''}10 conversations a day, free for everyone.
      </p>
    </PageShell>
  );
}
