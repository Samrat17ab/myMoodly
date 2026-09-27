'use client';

import { HelpButton } from './HelpButton';
import { Logo } from './Logo';

interface Props {
  initials: string;
  onHome: () => void;
  onGuide: () => void;
  onAccount: () => void;
  /** ring colour around the avatar, e.g. the colour of the last check-in */
  ringColor?: string;
}

/** Signed-in header. The daily connection count lives near the main button, not here. */
export function AppHeader({ initials, onHome, onGuide, onAccount, ringColor = '#A9C9B4' }: Props) {
  return (
    <header className="mm-appheader">
      <Logo onClick={onHome} />
      <nav className="mm-appheader__nav">
        <button type="button" className="mm-chip-link mm-hide-sm" onClick={onGuide}>
          Guide
        </button>
        <HelpButton className="mm-hide-sm" />
        <HelpButton variant="icon" className="mm-show-sm" />
        <button type="button" className="mm-avatar" style={{ borderColor: ringColor }} onClick={onAccount} aria-label="Your account">
          {initials}
        </button>
      </nav>
    </header>
  );
}
