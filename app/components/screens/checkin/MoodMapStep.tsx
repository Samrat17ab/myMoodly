"use client";
import { useState } from "react";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { MoodMapField, type MoodValue } from "@/app/components/shared/MoodMapField";
import { QuadrantTiles } from "@/app/components/shared/QuadrantTiles";

export function MoodMapStep({
  onContinue,
  onBack,
}: {
  onContinue: (energy: "high" | "low", pleasant: boolean) => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState<MoodValue>({ pleasant: 0.5, energy: 0.5 });
  const [useTiles, setUseTiles] = useState(false);

  return (
    <StepFlow
      step={1}
      title="How are you, right now?"
      subtitle="Place how you feel — quiet to buzzing, difficult to good. Don't overthink it."
      onBack={onBack}
    >
      {useTiles ? (
        <QuadrantTiles onPick={onContinue} />
      ) : (
        <div className="mood-map-step-field">
          <MoodMapField value={value} onChange={setValue} size={280} />
          <button
            type="button"
            className="primary wide"
            onClick={() => onContinue(value.energy >= 0.5 ? "high" : "low", value.pleasant >= 0.5)}
          >
            Continue
          </button>
        </div>
      )}
      <button type="button" className="text-button quiet-toggle" onClick={() => setUseTiles((v) => !v)}>
        {useTiles ? "Use the mood map instead" : "Prefer four simple choices instead?"}
      </button>
      <p className="reassure">There are no wrong answers here.</p>
    </StepFlow>
  );
}
