"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";
import type { MoodPoint } from "@/app/components/shared/Moodlight";

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
      <div className="word-grid">
        {words.map((word) => (
          <button key={word} type="button" onClick={() => onChoose(word)}>
            {word}
          </button>
        ))}
      </div>
      <button type="button" className="other" onClick={onNoneFit}>
        None of these fit
      </button>
    </StepFlow>
  );
}
