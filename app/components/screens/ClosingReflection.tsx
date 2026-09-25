"use client";
import { useState } from "react";
import { Moodlight, type MoodPoint } from "@/app/components/shared/Moodlight";
import { QuadrantTiles } from "@/app/components/shared/QuadrantTiles";
import { IconLeaf } from "@/app/components/icons";

type SurveyAnswers = { understood: string; change: string; partnerRating: string };

function SurveyQuestion({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="survey-q">
      <b>{label}</b>
      <div>
        {options.map((o) => (
          <button key={o} type="button" className={value === o ? "active" : ""} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ClosingReflection({
  emotion,
  beforeMood,
  survey,
  setSurvey,
  onSubmit,
  onSkip,
}: {
  emotion: string;
  beforeMood: MoodPoint;
  survey: SurveyAnswers;
  setSurvey: (v: SurveyAnswers) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const [afterMood, setAfterMood] = useState<MoodPoint | null>(null);

  return (
    <section className="panel compact-panel survey-panel">
      <div className="survey-art">
        <IconLeaf size={28} />
      </div>
      <h2>How did that feel?</h2>
      <p>Your answer helps us make future matches better.</p>

      <div className="mood-reflection">
        <div>
          <Moodlight {...beforeMood} size={56} breathe={false} />
          <small>You came in feeling {emotion || "—"}</small>
        </div>
        <div>
          <Moodlight {...(afterMood ?? beforeMood)} size={56} breathe={false} />
          <small>{afterMood ? "Leaving like this" : "How do you feel leaving?"}</small>
        </div>
      </div>
      {!afterMood && <QuadrantTiles onPick={(energy, pleasant) => setAfterMood({ energy: energy === "high" ? 1 : 0, pleasant: pleasant ? 1 : 0 })} />}

      <SurveyQuestion
        label="Did you feel understood in this conversation?"
        options={["Yes", "Somewhat", "No"]}
        value={survey.understood}
        onChange={(v) => setSurvey({ ...survey, understood: v })}
      />
      <SurveyQuestion
        label="How do you feel compared to before?"
        options={["Better", "Same", "Worse"]}
        value={survey.change}
        onChange={(v) => setSurvey({ ...survey, change: v })}
      />
      <SurveyQuestion
        label="How was this match?"
        options={["Great", "Okay", "Not for me"]}
        value={survey.partnerRating}
        onChange={(v) => setSurvey({ ...survey, partnerRating: v })}
      />
      <button type="button" className="primary wide" onClick={onSubmit}>
        Submit response
      </button>
      <button type="button" className="text-button skip" onClick={onSkip}>
        Skip for now
      </button>
    </section>
  );
}
