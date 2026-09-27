'use client';

import { motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { IconLeaf } from '../Icons';
import { MoodMap } from '../MoodMap';
import { SceneControls } from '../SceneControls';
import { Sanctuary } from '../sanctuary/Sanctuary';
import { EASE_OUT } from '../lib/motion';
import type { MoodPoint } from '../lib/mood';

interface Props {
  partnerName: string;
  /** the point from this conversation's check-in */
  before: MoodPoint;
  /** extra questions shown in the card (the app's feedback survey) */
  children?: ReactNode;
  /** "Back home": receives where the light ended up and whether it was moved */
  onDone: (after: MoodPoint, moved: boolean) => void;
  onSkip?: () => void;
  saving?: boolean;
}

export function shiftText(before: MoodPoint, after: MoodPoint, moved: boolean) {
  if (!moved) return 'Place your light again. There is no right answer.';
  const dist = Math.hypot(after.x - before.x, after.y - before.y);
  if (dist < 0.12) return 'About the same as when you came in. That is okay too.';
  if (after.x > 0.5 && after.y > 0.5) return 'Your light moved toward calm.';
  if (after.x > 0.5) return 'Your light moved somewhere brighter.';
  if (after.y > before.y) return 'Quieter now, even if it still feels heavy.';
  return 'Still stirred up. Checking in again later can help.';
}

export function ClosingReflection({ partnerName, before, children, onDone, onSkip, saving }: Props) {
  const [after, setAfter] = useState<MoodPoint>(before);
  const [moved, setMoved] = useState(false);

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
        <div className="mm-reflect__actions">
          <button type="button" className="mm-btn mm-btn--primary" onClick={() => onDone(after, moved)} disabled={saving}>
            {saving ? 'Saving…' : 'Back home'}
          </button>
          {onSkip && (
            <button type="button" className="mm-link mm-link--muted" onClick={onSkip}>
              Skip
            </button>
          )}
        </div>
      </motion.main>
      <div className="mm-reflect__footer">
        <SceneControls />
      </div>
    </div>
  );
}
