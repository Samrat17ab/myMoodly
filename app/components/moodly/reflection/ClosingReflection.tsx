'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { IconLeaf } from '../Icons';
import { MoodMap } from '../MoodMap';
import { SceneControls } from '../SceneControls';
import { Sanctuary } from '../sanctuary/Sanctuary';
import { EASE_OUT } from '../lib/motion';
import { quadrantOf, type MoodPoint } from '../lib/mood';

interface Props {
  partnerName: string;
  /** the point from this conversation's check-in */
  before: MoodPoint;
  /** extra questions shown in the card (the app's feedback survey) */
  children?: ReactNode;
  /** all feedback questions answered: the next-step choices appear */
  ready: boolean;
  /** conversations left today */
  remaining: number;
  /** the night has closed (past 3 AM IST): no new conversations until 9 PM */
  closed?: boolean;
  /** the word from this conversation's check-in */
  word?: string | null;
  /**
   * Saves the feedback, then: "again" finds someone new with the same
   * check-in, "change" reopens the check-in at the mood map (starting from
   * where the light ended up), "home" goes back home.
   */
  onNext: (choice: NextStep, after: MoodPoint) => void;
  onSkip?: () => void;
  saving?: boolean;
}

export type NextStep = 'again' | 'change' | 'home';

export function shiftText(before: MoodPoint, after: MoodPoint, moved: boolean) {
  if (!moved) return 'Place your light again. There is no right answer.';
  const dist = Math.hypot(after.x - before.x, after.y - before.y);
  if (dist < 0.12) return 'About the same as when you came in. That is okay too.';
  if (after.x > 0.5 && after.y > 0.5) return 'Your light moved toward calm.';
  if (after.x > 0.5) return 'Your light moved somewhere brighter.';
  if (after.y > before.y) return 'Quieter now, even if it still feels heavy.';
  return 'Still stirred up. Checking in again later can help.';
}

export function ClosingReflection({ partnerName, before, children, ready, remaining, closed, word, onNext, onSkip, saving }: Props) {
  const [after, setAfter] = useState<MoodPoint>(before);
  const [moved, setMoved] = useState(false);
  // Light moved to a different feeling area: suggest checking in afresh first.
  const moodChanged = moved && quadrantOf(after) !== quadrantOf(before);
  const canTalk = remaining > 0 && !closed;

  return (
    <div className="mm-reflect">
      <Sanctuary mode="full" />
      <div className="mm-reflect__scrim" aria-hidden="true" />
      <motion.main className="mm-reflect__card mm-glass" initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, ease: EASE_OUT }}>
        <h1 className="mm-display mm-display--lg">Thanks for showing up.</h1>
        <p className="mm-lede">Your conversation with {partnerName} has ended. Before you go, how do you feel now?</p>
        <MoodMap
          value={after}
          onChange={(p) => {
            setAfter(p);
            setMoved(true);
          }}
          size="sm"
          showZones={false}
          ghost={before}
          ghostLabel="when you came in"
          label="How do you feel now"
          className="mm-reflect__map"
        />
        <p className="mm-reflect__shift" aria-live="polite">
          <IconLeaf size={22} />
          <span>{shiftText(before, after, moved)}</span>
        </p>
        {children}
        <AnimatePresence mode="wait" initial={false}>
          {ready ? (
            <motion.div
              key="next"
              className="mm-reflect__next"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              {canTalk ? (
                <>
                  <p className="mm-reflect__next-title">Want to talk to someone new?</p>
                  <div className="mm-reflect__actions">
                    <button
                      type="button"
                      className={`mm-btn ${moodChanged ? 'mm-btn--glass' : 'mm-btn--primary'}`}
                      onClick={() => onNext('again', after)}
                      disabled={saving}
                    >
                      {word ? `Still ${word.toLowerCase()}, find someone` : 'Find someone new'}
                    </button>
                    <button
                      type="button"
                      className={`mm-btn ${moodChanged ? 'mm-btn--primary' : 'mm-btn--glass'}`}
                      onClick={() => onNext('change', after)}
                      disabled={saving}
                    >
                      My mood has changed
                    </button>
                  </div>
                  <p className="mm-fine">
                    {remaining} {remaining === 1 ? 'conversation' : 'conversations'} left today.{' '}
                    <button type="button" className="mm-link mm-link--muted" onClick={() => onNext('home', after)} disabled={saving}>
                      Back home
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <p className="mm-reflect__next-title">
                    {closed ? "That's it for tonight. We open again at 9 PM IST." : 'That was your last conversation for today.'}
                  </p>
                  <div className="mm-reflect__actions">
                    <button type="button" className="mm-btn mm-btn--primary" onClick={() => onNext('home', after)} disabled={saving}>
                      {saving ? 'Saving…' : 'Back home'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="waiting" className="mm-reflect__actions" exit={{ opacity: 0 }}>
              <p className="mm-fine">Answer the three questions to continue.</p>
              {onSkip && (
                <button type="button" className="mm-link mm-link--muted" onClick={onSkip}>
                  Skip
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
      <div className="mm-reflect__footer">
        <SceneControls />
      </div>
    </div>
  );
}
