"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { Moodlight, moodColor, type MoodPoint } from "@/app/components/shared/Moodlight";
import { readMood } from "@/app/lib/moodQuadrant";

// Words float into place with a small stagger -- per motion.csv guidance,
// long lists want a small per-item delay (~0.02s) so the reveal never drags.
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.018 } },
};
const pill = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 320, damping: 24 } },
};

export function WordPickerStep({
  words,
  allWords,
  selected,
  mood,
  onPick,
  onContinue,
  onNoneFit,
  onBack,
}: {
  /** the narrowed, nearby handful */
  words: string[];
  /** the full quadrant list, shown once "Show more words" is used */
  allWords: string[];
  selected: string;
  mood: MoodPoint;
  onPick: (word: string) => void;
  onContinue: () => void;
  onNoneFit: () => void;
  onBack: () => void;
}) {
  const [more, setMore] = useState(false);
  const list = more ? allWords : words;
  const { quadrant } = readMood(mood);
  const chipText = selected ? `${quadrant}, and feeling ${selected.toLowerCase()}` : quadrant;
  const pickColor = moodColor(mood);

  return (
    <StepFlow step={2} title="Which word fits best?" subtitle="These sit closest to where you placed your light." onBack={onBack}>
      <div className="mood-chip">
        <Moodlight {...mood} size={30} breathe layoutId="checkin-moodlight" />
        <span>{chipText}</span>
      </div>
      <motion.div className="word-grid" variants={container} initial="hidden" animate="visible">
        {list.map((word) => (
          <motion.button
            key={word}
            type="button"
            variants={pill}
            className={`word-pill${word === selected ? " is-on" : ""}`}
            style={word === selected ? { background: `color-mix(in srgb, ${pickColor} 55%, white)`, borderColor: pickColor } : undefined}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            aria-pressed={word === selected}
            onClick={() => onPick(word)}
          >
            {word}
          </motion.button>
        ))}
      </motion.div>
      <div className="word-scale">
        <span>Gentler</span>
        <span>Stronger</span>
      </div>
      <div className="word-links">
        <MotionButton type="button" className="word-more" onClick={() => setMore((m) => !m)}>
          {more ? "Show fewer words" : "Show more words"}
        </MotionButton>
        <MotionButton type="button" className="other" onClick={onNoneFit}>
          None of these fit
        </MotionButton>
      </div>
      {selected && (
        <MotionButton className="primary large" onClick={onContinue}>
          Continue
        </MotionButton>
      )}
    </StepFlow>
  );
}
