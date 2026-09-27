"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { QuadrantTiles } from "@/app/components/shared/QuadrantTiles";
import { MoodMapField, type MoodValue } from "@/app/components/shared/MoodMapField";
import { readMood } from "@/app/lib/moodQuadrant";

/** Merges the old separate energy + pleasantness questions into one
 * drag-based mood map. Two columns, like the rest of the check-in's
 * reading-plus-controls steps: the field on the left, everything you can
 * do with it on the right, instead of stacking it all in one column. */
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
  const { label, hint } = readMood(value);
  return (
    <StepFlow
      step={1}
      title="Where are you right now?"
      subtitle="Tap the spot that feels closest. Up is more energy, right feels better."
      onBack={onBack}
      className="step-flow-mood"
    >
      <div className="mood-map-columns">
        <MoodMapField value={value} onChange={onChange} size={480} layoutId="checkin-moodlight" />
        <div className="mood-map-reading">
          <div>
            <span className="mood-map-reading-eyebrow">{touched ? "Your light says" : "Your light is waiting"}</span>
            <div className="mood-map-reading-label" aria-live="polite">
              {touched ? label : "Somewhere in the middle"}
            </div>
            <p className="mood-map-reading-hint">{touched ? hint : "Tap the field, or use the arrow keys once it's focused."}</p>
            {touched && <p className="mood-map-reading-note">Not quite right? Tap again, as often as you like.</p>}
          </div>
          <div>
            <span className="mood-map-reading-eyebrow">Or choose a feeling area</span>
            <QuadrantTiles onPick={onQuadrant} />
            <MotionButton className="primary large mood-map-continue" onClick={onContinue} disabled={!touched}>
              Continue
            </MotionButton>
          </div>
        </div>
      </div>
    </StepFlow>
  );
}
