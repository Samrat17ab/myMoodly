"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";
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
        <button type="button" className="pleasant" onClick={() => onChoose(true)}>
          <span className="choice-art">
            <IconPleasant size={32} />
          </span>
          <b>Pleasant</b>
          <small>Good, comfortable, welcome</small>
        </button>
        <button type="button" className="unpleasant" onClick={() => onChoose(false)}>
          <span className="choice-art">
            <IconUnpleasant size={32} />
          </span>
          <b>Unpleasant</b>
          <small>Difficult, uncomfortable, heavy</small>
        </button>
      </div>
      <p className="reassure">There are no wrong answers here.</p>
    </StepFlow>
  );
}
