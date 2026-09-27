'use client';

import { useEffect, useRef, useState } from 'react';
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

const SMALL_SCREEN = '(max-width: 720px)';

/** Signed-in header. The daily connection count lives near the main button, not here. */
export function AppHeader({ initials, onHome, onGuide, onAccount, ringColor = '#A9C9B4' }: Props) {
  // On phones the Guide link doesn't fit, so the avatar opens a small menu.
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const onAvatar = () => {
    if (window.matchMedia(SMALL_SCREEN).matches) setMenuOpen((o) => !o);
    else onAccount();
  };
  const choose = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className="mm-appheader">
      <Logo onClick={onHome} />
      <nav className="mm-appheader__nav">
        <button type="button" className="mm-chip-link mm-hide-sm" onClick={onGuide}>
          Guide
        </button>
        <HelpButton className="mm-hide-sm" />
        <HelpButton variant="icon" className="mm-show-sm" />
        <div className="mm-appheader__menuwrap" ref={wrapRef}>
          <button type="button" className="mm-avatar" style={{ borderColor: ringColor }} onClick={onAvatar} aria-label="Your account" aria-haspopup="menu" aria-expanded={menuOpen}>
            {initials}
          </button>
          {menuOpen && (
            <div className="mm-appmenu" role="menu">
              <button type="button" role="menuitem" onClick={choose(onHome)}>
                Home
              </button>
              <button type="button" role="menuitem" onClick={choose(onGuide)}>
                How myMoodly works
              </button>
              <button type="button" role="menuitem" onClick={choose(onAccount)}>
                Your account
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
