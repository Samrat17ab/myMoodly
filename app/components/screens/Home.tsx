"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moodlight } from "@/app/components/shared/Moodlight";
import { IconPlay } from "@/app/components/icons";

function greeting(hour: number) {
  if (hour < 5) return "You're up late.";
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

const BREATHE_IN_MS = 4000;
const BREATHE_OUT_MS = 6000;
const GUIDED_BREATH_SECONDS = 60;

export function Home({ usage, onStart, onGuide }: { usage: number; onStart: () => void; onGuide: () => void }) {
  const [hour, setHour] = useState(12); // safe default until the client corrects it
  const [breathingIn, setBreathingIn] = useState(true);
  // null = no guided breath running; otherwise seconds remaining.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const readClientHour = () => setHour(new Date().getHours());
    readClientHour();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setBreathingIn((v) => !v), breathingIn ? BREATHE_IN_MS : BREATHE_OUT_MS);
    return () => clearTimeout(id);
  }, [breathingIn]);

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
        <button type="button" className="primary large" onClick={onStart}>
          Start a check-in
        </button>
        <p className="home-usage-line">{usage} of 10 connections today</p>
        <button type="button" className="watch" onClick={onGuide}>
          <IconPlay size={12} /> How myMoodly works
        </button>
      </div>
      <div className="home-visual">
        <button type="button" className="breath-card" onClick={() => setSecondsLeft(GUIDED_BREATH_SECONDS)}>
          <Moodlight layoutId="moodlight" size={100} pleasant={0.6} energy={0.4} />
          <span>{secondsLeft === null ? "Take a moment" : `${secondsLeft}s left`}</span>
          <motion.b key={breathingIn ? "in" : "out"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {breathingIn ? "Breathe in" : "Breathe out"}
          </motion.b>
        </button>
      </div>
    </section>
  );
}
