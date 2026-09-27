"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { QuadrantTiles } from "@/app/components/shared/QuadrantTiles";
import { MoodMapField, type MoodValue } from "@/app/components/shared/MoodMapField";

function describe(value: MoodValue) {
  const energy = value.energy >= 0.5 ? "buzzing" : "quiet";
  const pleasant = value.pleasant >= 0.5 ? "good" : "difficult";
  return `Feeling ${pleasant} and ${energy}`;
}

/** Merges the old separate energy + pleasantness questions into one
 * drag-based mood map, with the four quadrant tiles underneath as a
 * tap-only alternative to dragging. */
export function MoodMapStep({
  value,
  touched,
  onChange,
  onQuadrant,
  onContinue,
  onBack,
}: {
  value: MoodValue;
  touched: boolean;
  onChange: (value: MoodValue) => void;
  onQuadrant: (energy: "high" | "low", pleasant: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <StepFlow step={1} title="How are you feeling right now?" subtitle="Drag the light to the spot that feels closest." onBack={onBack}>
      <div className="mood-map-step-field">
        <MoodMapField value={value} onChange={onChange} size={280} layoutId="checkin-moodlight" />
        <p className="reassure" aria-live="polite">
          {touched ? describe(value) : "There are no wrong answers here."}
        </p>
        <p className="reassure">Or choose the feeling that&apos;s closest</p>
        <QuadrantTiles onPick={onQuadrant} />
        <MotionButton className="primary large" onClick={onContinue} disabled={!touched}>
          Continue
        </MotionButton>
      </div>
    </StepFlow>
  );
}
