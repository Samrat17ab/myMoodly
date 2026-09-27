'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import { HelpButton } from '../HelpButton';
import { Logo } from '../Logo';
import { Moodlight } from '../Moodlight';
import { Sanctuary } from '../sanctuary/Sanctuary';
import { EASE_OUT } from '../lib/motion';
import { MOOD_HEX } from '../lib/mood';
import type { Intent } from '../checkin/types';

interface Props {
  status: 'searching' | 'found';
  /** the user's Moodlight colour (moodColor(point)) */
  color: string;
  word: string | null;
  moodLabel: string;
  intent: Intent;
  /** seconds since the search started (from the existing queue state) */
  elapsedSeconds: number;
  partnerName?: string;
  partnerWord?: string;
  partnerColor?: string;
  /** the server says nobody matching is here, but others are */
  canRelax?: boolean;
  relaxRequesting?: boolean;
  onRelax?: () => void;
  onCancel: () => void;
  onOpen: () => void;
}

const LINES = [
  'People here are real, and just as anonymous as you are.',
  'You can leave any conversation, at any moment. No explanation needed.',
  'A good first message is simple. Hi, how is tonight going for you?',
  'While you wait, let your shoulders drop a little.',
];

export function WaitingRoom(props: Props) {
  const { status, color, word, moodLabel, intent, elapsedSeconds, partnerName, partnerWord, partnerColor = MOOD_HEX.heavy, canRelax, relaxRequesting, onRelax, onCancel, onOpen } = props;
  const reduce = useReducedMotion();
  const found = status === 'found';

  // Let people in another tab notice.
  useEffect(() => {
    if (!found) return;
    const prev = document.title;
    document.title = 'Someone is here · myMoodly';
    return () => {
      document.title = prev;
    };
  }, [found]);

  const secs = Math.max(0, elapsedSeconds);
  const elapsed = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const line = LINES[Math.floor(secs / 20) % LINES.length];

  return (
    <div className="mm-waiting">
      <Sanctuary mode="full" />
      <div className="mm-waiting__scrim" aria-hidden="true" />
      <header className="mm-topbar">
        <Logo onClick={onCancel} />
        <HelpButton />
      </header>

      <main className="mm-waiting__main">
        <div className="mm-waiting__stage" aria-hidden="true">
          <motion.div animate={{ x: found ? -46 : 0 }} transition={{ duration: reduce ? 0 : 2.4, ease: EASE_OUT }} className="mm-waiting__self">
            {!found && <span className="mm-waiting__ring" />}
            {!found && <span className="mm-waiting__ring mm-waiting__ring--late" />}
            <Moodlight color={color} size={120} />
          </motion.div>
          <AnimatePresence>
            {found && (
              <motion.div
                className="mm-waiting__other"
                initial={{ opacity: 0, x: 160, scale: 0.6 }}
                animate={{ opacity: 1, x: 46, scale: 1 }}
                transition={{ duration: reduce ? 0 : 2.4, ease: EASE_OUT }}
              >
                <Moodlight color={partnerColor} size={96} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {!found ? (
            <motion.div key="search" className="mm-waiting__copy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.6, ease: EASE_OUT }}>
              <div className="mm-waiting__cue" aria-hidden="true">
                <span className="mm-cue-in">Breathe in with the light</span>
                <span className="mm-cue-out">And slowly let it go</span>
              </div>
              <h1 className="mm-display mm-display--lg">Finding someone who gets it</h1>
            </motion.div>
          ) : (
            <motion.div key="found" className="mm-waiting__copy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE_OUT }} role="status">
              <p className="mm-waiting__eyebrow">{partnerName ?? 'Someone'} is here</p>
              <h1 className="mm-display mm-display--lg">Say hello when you&apos;re ready</h1>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mm-waiting__summary mm-glass">
          <div>
            <span className="mm-fine">You checked in as</span>
            <strong>{word ?? moodLabel}</strong>
          </div>
          <div>
            <span className="mm-fine">Looking for</span>
            <strong>{intent === 'similar' ? 'Someone who feels similar' : 'A different headspace'}</strong>
          </div>
        </div>

        {!found ? (
          <div className="mm-waiting__foot">
            <AnimatePresence mode="wait">
              <motion.p key={line} className="mm-body mm-waiting__line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                {line}
              </motion.p>
            </AnimatePresence>
            <p className="mm-fine">Waiting {elapsed}</p>
            {(canRelax || secs >= 90) && (
              <motion.div className="mm-waiting__options" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT }}>
                <p className="mm-body">
                  {canRelax
                    ? "The kind of match you wanted isn't here right now, but others are waiting to talk."
                    : "It's quiet right now. You can keep waiting, or:"}
                </p>
                <div className="mm-waiting__option-row">
                  {canRelax && onRelax && (
                    <button type="button" className="mm-btn mm-btn--quiet mm-btn--sm" onClick={onRelax} disabled={relaxRequesting}>
                      {relaxRequesting ? 'Connecting…' : 'Connect me with someone here'}
                    </button>
                  )}
                  <button type="button" className="mm-btn mm-btn--quiet mm-btn--sm" onClick={onCancel}>
                    Come back later
                  </button>
                </div>
              </motion.div>
            )}
            <button type="button" className="mm-link" onClick={onCancel}>
              Stop searching
            </button>
          </div>
        ) : (
          <div className="mm-waiting__foot">
            {partnerWord && <p className="mm-body">They&apos;re feeling {partnerWord.toLowerCase()}. You don&apos;t have to fix anything, just be there.</p>}
            <button type="button" className="mm-btn mm-btn--primary" onClick={onOpen}>
              Open conversation
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
