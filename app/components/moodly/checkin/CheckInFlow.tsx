'use client';

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { StepHeader } from '../StepHeader';
import { Sanctuary } from '../sanctuary/Sanctuary';
import { useSanctuary } from '../sanctuary/SanctuaryProvider';
import { quadrantOf, toBackendMood, type MoodPoint } from '../lib/mood';
import { stepVariants } from '../lib/motion';
import { DetailsStep } from './DetailsStep';
import { MoodMapStep } from './MoodMapStep';
import { WordStep } from './WordStep';
import type { CheckInPayload, Intent } from './types';

interface Props {
  remaining: number;
  /** calls the existing check-in + matchmaking request */
  onSubmit: (payload: CheckInPayload) => void | Promise<void>;
  /** back from step 1 */
  onExit: () => void;
  submitting?: boolean;
  /** restore a previous check-in (e.g. after a search was cancelled) */
  initial?: { point: MoodPoint; word: string; note: string; intent: Intent } | null;
}

const TOTAL = 3;

/**
 * The whole check-in lives on one screen so the Moodlight can travel between
 * steps (shared layoutId). Three steps:
 *   1. mood map (energy + pleasantness in one gesture)
 *   2. the word
 *   3. optional note + who to talk to
 */
export function CheckInFlow({ remaining, onSubmit, onExit, submitting, initial }: Props) {
  const [step, setStep] = useState(initial ? 2 : 0);
  const [dir, setDir] = useState(1);
  const [point, setPoint] = useState<MoodPoint>(initial?.point ?? { x: 0.5, y: 0.5 });
  const [touched, setTouched] = useState(!!initial);
  const [word, setWord] = useState<string | null>(initial?.word ?? null);
  const [note, setNote] = useState(initial?.note ?? '');
  const [intent, setIntent] = useState<Intent>(initial?.intent ?? 'similar');
  const { setMood } = useSanctuary();

  // The scene quietly leans toward the mood once the light is placed.
  useEffect(() => {
    if (touched) setMood(quadrantOf(point));
  }, [touched, point, setMood]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = () => {
    if (!word) return;
    return onSubmit({ point, quadrant: quadrantOf(point), ...toBackendMood(point), word, note: note.trim(), intent });
  };

  return (
    <div className="mm-checkin">
      <Sanctuary mode="soft" />
      <StepHeader step={step + 1} total={TOTAL} onBack={() => (step === 0 ? onExit() : go(step - 1))} />
      <LayoutGroup id="mm-checkin">
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.section key={step} className="mm-checkin__step" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
            {step === 0 && (
              <MoodMapStep
                point={point}
                touched={touched}
                onChange={(p) => {
                  setPoint(p);
                  setTouched(true);
                  if (quadrantOf(p) !== quadrantOf(point)) setWord(null);
                }}
                onNext={() => go(1)}
              />
            )}
            {step === 1 && (
              <WordStep
                point={point}
                word={word}
                onPick={setWord}
                onNext={() => go(2)}
                onRepoint={(p) => {
                  setPoint(p);
                  setWord(null);
                }}
              />
            )}
            {step === 2 && (
              <DetailsStep
                point={point}
                word={word}
                note={note}
                onNote={setNote}
                intent={intent}
                onIntent={setIntent}
                remaining={remaining}
                submitting={submitting}
                onSubmit={() => void submit()}
              />
            )}
          </motion.section>
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
