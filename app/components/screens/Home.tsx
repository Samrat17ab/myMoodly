"use client";
import { useEffect, useState } from "react";
import { BreathingMoment } from "@/app/components/shared/BreathingMoment";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { IconPlay } from "@/app/components/icons";

function greeting(hour: number) {
  if (hour < 5) return "You're up late.";
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

const GUIDED_BREATH_SECONDS = 60;

export function Home({ usage, onStart, onGuide }: { usage: number; onStart: () => void; onGuide: () => void }) {
  const [hour, setHour] = useState(12); // safe default until the client corrects it
  // null = no guided breath running; otherwise seconds remaining.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const readClientHour = () => setHour(new Date().getHours());
    readClientHour();
  }, []);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  return (
    <section className="home-view">
      <div className="home-copy">
        <h1>
          {greeting(hour)}
          <br />
          How are you, really?
        </h1>
        <p>Take a breath. Name what you&apos;re feeling, then connect with someone who can meet you there.</p>
        <MotionButton className="primary large" onClick={onStart}>
          Start a check-in
        </MotionButton>
        <p className="home-usage-line">{usage} of 10 connections today</p>
        <MotionButton className="watch" onClick={onGuide}>
          <IconPlay size={12} /> How myMoodly works
        </MotionButton>
      </div>
      <div className="home-visual">
        <BreathingMoment secondsLeft={secondsLeft} onActivate={() => setSecondsLeft(GUIDED_BREATH_SECONDS)} />
      </div>
    </section>
  );
}
