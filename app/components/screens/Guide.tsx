"use client";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { Sanctuary } from "@/app/components/sanctuary/Sanctuary";
import { IconBack } from "@/app/components/icons";

const STEPS: [string, string, string][] = [
  ["01", "Name what you feel", "Two quick questions guide you to one of 100 precise emotion words."],
  ["02", "Choose your intention", "Talk with someone who feels similar, or someone in a different headspace."],
  ["03", "Meet anonymously", "You're matched by mood and shared language — never by country, age, or gender."],
  ["04", "Talk for 20 minutes", "A quiet timer keeps things contained. Continue only when you both agree."],
  ["05", "Stay in control", "Report or block at any time. Emergency resources are always one tap away."],
];

export function Guide({ onBack }: { onBack: () => void }) {
  return (
    <section className="guide-view">
      <Sanctuary mode="softened" showControls={false} />
      <MotionButton className="back" onClick={onBack} aria-label="Back">
        <IconBack size={16} />
      </MotionButton>
      <p className="guide-eyebrow">How myMoodly works</p>
      <h1>
        A small check-in.
        <br />A real human moment.
      </h1>
      <div className="guide-grid">
        {STEPS.map(([n, title, body]) => (
          <div className="guide-step" key={n}>
            <span className="guide-num">{n}</span>
            <b>{title}</b>
            <p>{body}</p>
          </div>
        ))}
      </div>
      <p className="guide-limit">10 conversations a day, free for everyone.</p>
    </section>
  );
}
