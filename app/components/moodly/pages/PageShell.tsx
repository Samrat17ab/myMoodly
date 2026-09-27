'use client';

import type { ReactNode } from 'react';
import { AppHeader } from '../AppHeader';
import { HelpButton } from '../HelpButton';
import { Logo } from '../Logo';
import { SceneControls } from '../SceneControls';
import { Sanctuary } from '../sanctuary/Sanctuary';

export interface HeaderNav {
  initials: string;
  onHome: () => void;
  onGuide: () => void;
  onAccount: () => void;
}

interface Props {
  /** signed in: the full app header. Otherwise a quiet top bar. */
  nav?: HeaderNav | null;
  /** top bar (not signed in): where the logo goes */
  onLogo?: () => void;
  /** extra content on the right of the top bar */
  topbarExtra?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}

/** Reading pages: the scene softened behind, a glass panel in front. */
export function PageShell({ nav, onLogo, topbarExtra, wide, children }: Props) {
  return (
    <div className="mm-page">
      <Sanctuary mode="soft" />
      {nav ? (
        <AppHeader initials={nav.initials} onHome={nav.onHome} onGuide={nav.onGuide} onAccount={nav.onAccount} />
      ) : (
        <header className="mm-topbar">
          {onLogo ? <Logo onClick={onLogo} /> : <Logo />}
          <nav className="mm-topbar__nav">
            {topbarExtra}
            <HelpButton className="mm-hide-sm" />
            <HelpButton variant="icon" className="mm-show-sm" />
          </nav>
        </header>
      )}
      <main className="mm-page__main">
        <div className={`mm-page__panel mm-glass mm-rise${wide ? ' mm-page__panel--wide' : ''}`}>{children}</div>
      </main>
      <div className="mm-page__footer mm-hide-sm">
        <SceneControls />
      </div>
    </div>
  );
}
