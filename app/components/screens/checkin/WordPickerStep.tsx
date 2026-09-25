"use client";
import { useState } from "react";
import { StepFlow } from "@/app/components/shared/StepFlow";
import type { MoodPoint } from "@/app/components/shared/Moodlight";

const INITIAL_COUNT = 10;

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
  const [showAll, setShowAll] = useState(false);
  // The source lists run intense -> mild; reversed so the gentlest, closest
  // words surface first, per the brief's "gentle to intense" ordering.
  const ordered = [...words].reverse();
  const visible = showAll ? ordered : ordered.slice(0, INITIAL_COUNT);

  return (
    <StepFlow step={2} title="Which word feels closest?" subtitle="Pick the one that names this moment best." onBack={onBack} mood={mood}>
      <div className="word-grid">
        {visible.map((word) => (
          <button key={word} type="button" onClick={() => onChoose(word)}>
            {word}
          </button>
        ))}
      </div>
      {!showAll && (
        <button type="button" className="text-button quiet-toggle" onClick={() => setShowAll(true)}>
          Show more words
        </button>
      )}
      <button type="button" className="other" onClick={onNoneFit}>
        None of these fit
      </button>
    </StepFlow>
  );
}
