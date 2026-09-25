"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { QuadrantTiles } from "@/app/components/shared/QuadrantTiles";

/** Reached from the word step's "None of these fit" -- a second chance to
 * name the broad feeling directly, using the same tiles as the mood map's
 * accessible fallback. */
export function QuadrantFallbackStep({
  onPick,
  onBack,
}: {
  onPick: (energy: "high" | "low", pleasant: boolean) => void;
  onBack: () => void;
}) {
  return (
    <StepFlow step={1} title="Let's try another direction" subtitle="Choose the broad feeling that feels nearest." onBack={onBack}>
      <QuadrantTiles onPick={onPick} />
    </StepFlow>
  );
}
