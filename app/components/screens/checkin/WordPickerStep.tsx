"use client";
import { motion } from "framer-motion";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { MotionButton } from "@/app/components/shared/MotionButton";
import type { MoodPoint } from "@/app/components/shared/Moodlight";

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
  mood,
  onChoose,
  onNoneFit,
  onBack,
}: {
  words: string[];
  mood: MoodPoint;
  onChoose: (word: string) => void;
  onNoneFit: () => void;
  onBack: () => void;
}) {
  return (
    <StepFlow step={3} title="Which word feels closest?" subtitle="Pick the one that best names this moment." onBack={onBack} mood={mood}>
      <motion.div className="word-grid" variants={container} initial="hidden" animate="visible">
        {words.map((word) => (
          <motion.button
            key={word}
            type="button"
            variants={pill}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            onClick={() => onChoose(word)}
          >
            {word}
          </motion.button>
        ))}
      </motion.div>
      <MotionButton type="button" className="other" onClick={onNoneFit}>
        None of these fit
      </MotionButton>
    </StepFlow>
  );
}
