"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { IconPleasant, IconUnpleasant } from "@/app/components/icons";

export function PleasantnessStep({
  onChoose,
  onBack,
}: {
  onChoose: (value: boolean) => void;
  onBack: () => void;
}) {
  return (
    <StepFlow step={2} title="How pleasant does it feel?" subtitle="There isn't a right answer — only yours." onBack={onBack}>
      <div className="choice-grid">
        <MotionButton className="pleasant" onClick={() => onChoose(true)}>
          <span className="choice-art">
            <IconPleasant size={32} />
          </span>
          <b>Pleasant</b>
          <small>Good, comfortable, welcome</small>
        </MotionButton>
        <MotionButton className="unpleasant" onClick={() => onChoose(false)}>
          <span className="choice-art">
            <IconUnpleasant size={32} />
          </span>
          <b>Unpleasant</b>
          <small>Difficult, uncomfortable, heavy</small>
        </MotionButton>
      </div>
      <p className="reassure">There are no wrong answers here.</p>
    </StepFlow>
  );
}
