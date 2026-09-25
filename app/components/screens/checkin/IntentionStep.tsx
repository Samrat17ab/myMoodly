"use client";
import { StepFlow } from "@/app/components/shared/StepFlow";
import type { MoodPoint } from "@/app/components/shared/Moodlight";
import { IconCheck, IconDifferent, IconSimilar } from "@/app/components/icons";

export function IntentionStep({
  mode,
  setMode,
  usage,
  mood,
  onFindSomeone,
  onBack,
}: {
  mode: "similar" | "different";
  setMode: (m: "similar" | "different") => void;
  usage: number;
  mood: MoodPoint;
  onFindSomeone: () => void;
  onBack: () => void;
}) {
  return (
    <StepFlow
      step={4}
      title="Who would feel right to talk to?"
      subtitle="You can choose differently every time you check in."
      onBack={onBack}
      mood={mood}
    >
      <div className="mode-stack">
        <button type="button" className={mode === "similar" ? "selected" : ""} onClick={() => setMode("similar")}>
          <span className="mode-icon">
            <IconSimilar size={20} />
          </span>
          <span>
            <b>Someone who feels similar</b>
            <small>Be met by someone in a close emotional place</small>
          </span>
          <i>
            <IconCheck size={16} />
          </i>
        </button>
        <button type="button" className={mode === "different" ? "selected" : ""} onClick={() => setMode("different")}>
          <span className="mode-icon">
            <IconDifferent size={20} />
          </span>
          <span>
            <b>Someone in a different headspace</b>
            <small>Connect with a contrasting perspective</small>
          </span>
          <i>
            <IconCheck size={16} />
          </i>
        </button>
      </div>
      <button type="button" className="primary wide" onClick={onFindSomeone}>
        Find someone
      </button>
      <p className="free-left">{10 - usage} free connections left today</p>
    </StepFlow>
  );
}
