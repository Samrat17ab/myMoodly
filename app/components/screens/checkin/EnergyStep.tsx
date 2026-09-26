"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { IconEnergyHigh, IconEnergyLow } from "@/app/components/icons";

export function EnergyStep({
  onChoose,
  onBack,
}: {
  onChoose: (value: "high" | "low") => void;
  onBack: () => void;
}) {
  return (
    <StepFlow step={1} title="How's your energy right now?" subtitle="Don't overthink it — choose what feels closest." onBack={onBack}>
      <div className="choice-grid">
        <MotionButton className="energy-high" onClick={() => onChoose("high")}>
          <span className="choice-art">
            <IconEnergyHigh size={32} />
          </span>
          <b>High energy</b>
          <small>Activated, alert, buzzing</small>
        </MotionButton>
        <MotionButton className="energy-low" onClick={() => onChoose("low")}>
          <span className="choice-art">
            <IconEnergyLow size={32} />
          </span>
          <b>Low energy</b>
          <small>Quiet, slow, still</small>
        </MotionButton>
      </div>
      <p className="reassure">There are no wrong answers here.</p>
    </StepFlow>
  );
}
