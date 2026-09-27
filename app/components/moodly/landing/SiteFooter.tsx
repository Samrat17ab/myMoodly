'use client';

import Link from 'next/link';
import { HelpButton } from '../HelpButton';
import { Logo } from '../Logo';

export function SiteFooter({ onGuide }: { onGuide: () => void }) {
  return (
    <footer className="mm-footer">
      <div className="mm-footer__brand">
        <Logo size={34} compact />
        <span className="mm-fine">myMoodly, {new Date().getFullYear()}</span>
      </div>
      <nav className="mm-footer__nav">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <button type="button" className="mm-footer__navbtn" onClick={onGuide}>
          Guide
        </button>
        <HelpButton variant="inline" />
      </nav>
    </footer>
  );
}
