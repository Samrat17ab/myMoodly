'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { IconClose } from './Icons';
import { OPEN_HELP_EVENT } from './HelpButton';
import { EASE_OUT } from './lib/motion';
import { HELP_TIPS, resourcesFor } from './lib/resources';

/** Mount once at the app root. Every "Need help now?" button opens it. */
export function HelpSheet({ country = '' }: { country?: string }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const resources = resourcesFor(country);

  useEffect(() => {
    const onOpen = () => {
      lastFocus.current = document.activeElement;
      setOpen(true);
    };
    window.addEventListener(OPEN_HELP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_HELP_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (lastFocus.current instanceof HTMLElement) lastFocus.current.focus();
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="mm-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mm-help-title"
            className="mm-sheet"
            onKeyDown={onKeyDown}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.55, ease: EASE_OUT } }}
            exit={{ y: 30, opacity: 0, transition: { duration: 0.3 } }}
          >
            <button ref={closeRef} type="button" className="mm-iconbtn mm-sheet__close" onClick={() => setOpen(false)} aria-label="Close">
              <IconClose />
            </button>
            <h2 id="mm-help-title" className="mm-sheet__title">You don&apos;t have to hold this alone.</h2>
            <p className="mm-sheet__text">
              If you are in immediate danger or thinking about ending your life, please call your local emergency number now.
              myMoodly is peer support, not a crisis service.
            </p>
            <ul className="mm-sheet__list">
              {resources.map((r) => (
                <li key={r.name}>
                  <a className="mm-sheet__resource" href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    <span className="mm-sheet__resource-name">
                      {r.name} &middot; {r.detail}
                    </span>
                    <span className="mm-sheet__resource-detail">{r.note}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mm-sheet__text">While you reach out:</p>
            <ul className="mm-help-tips">
              {HELP_TIPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <a className="mm-btn mm-btn--quiet" href="https://findahelpline.com" target="_blank" rel="noreferrer">
              Find a helpline near you
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
