'use client';

import Link from 'next/link';
import { HelpButton } from '../HelpButton';
import { Logo } from '../Logo';
import { SceneControls } from '../SceneControls';
import { Sanctuary } from '../sanctuary/Sanctuary';

const DRIFTING = [
  { text: 'quietly hopeful', left: '79%', top: '28%', delay: '0s' },
  { text: 'a little lost', left: '56%', top: '34%', delay: '-6s' },
  { text: "can't sleep tonight", left: '83%', top: '45%', delay: '-12s' },
];

export function LandingHero({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className="mm-hero">
      <Sanctuary mode="full" fixed={false} />
      {DRIFTING.map((d) => (
        <span key={d.text} className="mm-hero__feeling" style={{ left: d.left, top: d.top, animationDelay: d.delay }} aria-hidden="true">
          {d.text}
        </span>
      ))}
      <div className="mm-hero__scrim" aria-hidden="true" />

      <header className="mm-topbar">
        <Logo />
        <nav className="mm-topbar__nav">
          <a href="#how" className="mm-topbar__link mm-hide-sm">
            How it works
          </a>
          <Link href="/blog" className="mm-topbar__link">
            Blog
          </Link>
          <button type="button" className="mm-btn mm-btn--glass mm-btn--sm" onClick={onSignIn}>
            Sign in
          </button>
        </nav>
      </header>

      <div className="mm-hero__content">
        <h1 className="mm-display mm-display--xl mm-rise">Feel it. Share it. Let it move.</h1>
        <p className="mm-lede mm-rise mm-d1">
          Name how you feel, then talk it through with one real person who&apos;s in a similar place, or a different one. No profile, no followers, nothing to keep up.
        </p>
        <div className="mm-hero__actions mm-rise mm-d2">
          <button type="button" className="mm-btn mm-btn--primary" onClick={onSignIn}>
            Check in
          </button>
          <a href="#how" className="mm-link">
            See how it works
          </a>
        </div>
        <p className="mm-fine mm-rise mm-d3">Free, for adults 18 and over. Not a crisis service.</p>
      </div>

      <div className="mm-hero__footer">
        <SceneControls />
        <HelpButton />
      </div>
    </section>
  );
}
