'use client';

import { motion } from 'framer-motion';
import { useState, type CSSProperties } from 'react';
import { deepColor, describeMood, moodColor, QUADRANT_CENTER, QUADRANT_NAME, QUADRANTS, quadrantOf, type MoodPoint } from '../lib/mood';
import { EASE_OUT } from '../lib/motion';
import { wordsFor } from '../lib/words';
import { MoodChip } from './MoodChip';

interface Props {
  point: MoodPoint;
  word: string | null;
  onPick: (w: string) => void;
  onNext: () => void;
  /** "None of these fit": move the light to another feeling area */
  onRepoint: (p: MoodPoint) => void;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function WordStep({ point, word, onPick, onNext, onRepoint }: Props) {
  const [more, setMore] = useState(false);
  const [elsewhere, setElsewhere] = useState(false);
  const words = wordsFor(point, 10, more);
  const d = describeMood(point);
  const current = quadrantOf(point);
  const chip = word ? `${d.label}, and feeling ${word.toLowerCase()}` : d.label;

  return (
    <div className="mm-wordstep">
      <MoodChip point={point} text={chip} />
      <div className="mm-steptitle">
        <h1 className="mm-display mm-display--lg">Which word fits best?</h1>
        <p className="mm-lede">These sit closest to where you placed your light.</p>
      </div>
      <div
        className="mm-wordstep__cloud"
        role="group"
        aria-label="Feeling words, from gentler to stronger"
        style={{ '--mm-pick': moodColor(point), '--mm-pick-deep': deepColor(moodColor(point), 0.25) } as CSSProperties}
      >
        {words.map((w, i) => {
          const on = w === word;
          return (
            <motion.button
              key={w}
              type="button"
              className={`mm-wordpill${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => onPick(w)}
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.04 }}
            >
              {w}
            </motion.button>
          );
        })}
      </div>
      <div className="mm-wordstep__scale" aria-hidden="true">
        <span>Gentler</span>
        <span>Stronger</span>
      </div>
      <div className="mm-wordstep__links">
        <button type="button" className="mm-link" onClick={() => setMore((m) => !m)}>
          {more ? 'Show fewer words' : 'Show more words'}
        </button>
        <button type="button" className="mm-link mm-link--muted" onClick={() => setElsewhere((e) => !e)} aria-expanded={elsewhere}>
          None of these fit
        </button>
      </div>
      {elsewhere && (
        <div className="mm-wordstep__elsewhere">
          <span className="mm-fine">Try another feeling area</span>
          <div className="mm-mapstep__quadgrid">
            {QUADRANTS.map((q) => (
              <button
                key={q}
                type="button"
                className={`mm-choicepill${q === current ? ' is-on' : ''}`}
                aria-pressed={q === current}
                onClick={() => {
                  onRepoint(QUADRANT_CENTER[q]);
                  setMore(false);
                  setElsewhere(false);
                }}
              >
                {cap(QUADRANT_NAME[q])}
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="button" className="mm-btn mm-btn--primary" onClick={onNext} disabled={!word}>
        Continue
      </button>
    </div>
  );
}
