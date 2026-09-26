"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";

type Quadrant = "red" | "yellow" | "green" | "blue";

const CATEGORIES: { quadrant: Quadrant; label: string; hint: string }[] = [
  { quadrant: "red", label: "Angry", hint: "High & unpleasant" },
  { quadrant: "blue", label: "Sad", hint: "Low & unpleasant" },
  { quadrant: "yellow", label: "Happy", hint: "High & pleasant" },
  { quadrant: "green", label: "Calm", hint: "Low & pleasant" },
];

/** Reached from the word step's "None of these fit" -- a second chance to
 * name the broad feeling directly, exactly as the original category step
 * did (same four quadrants, same labels). */
export function QuadrantFallbackStep({
  onPick,
  onBack,
}: {
  onPick: (quadrant: Quadrant) => void;
  onBack: () => void;
}) {
  return (
    <StepFlow step={3} title="Let's try another direction" subtitle="Choose the broad feeling that feels nearest." onBack={onBack}>
      <div className="category-grid">
        {CATEGORIES.map((c) => (
          <button key={c.quadrant} type="button" onClick={() => onPick(c.quadrant)}>
            <span className={`dot ${c.quadrant}`} />
            <b>{c.label}</b>
            <small>{c.hint}</small>
          </button>
        ))}
      </div>
      <p className="reassure">There are no wrong answers here.</p>
    </StepFlow>
  );
}
