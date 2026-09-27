"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Moodlight } from "@/app/components/shared/Moodlight";
import type { MoodPoint } from "@/app/components/shared/Moodlight";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { Sanctuary } from "@/app/components/sanctuary/Sanctuary";
import { useBreathingCycle } from "@/app/hooks/useBreathingCycle";

const REASSURANCE_LINES = [
  "You can leave at any point, no explanation needed.",
  "Once matched, you'll both land in the conversation together.",
  "Conversations here are anonymous — no names, no profiles.",
  "If it doesn't feel right once you're talking, you can end it any time.",
  "Take a slow breath while we find the right match.",
];
const REASSURANCE_INTERVAL_MS = 25000;

export function Waiting({
  emotion,
  mode,
  mood,
  elapsedLabel,
  matchFound,
  canRelax,
  relaxDismissed,
  relaxRequesting,
  onRelax,
  onDismissRelax,
  onCancel,
}: {
  emotion: string;
  mode: "similar" | "different";
  mood: MoodPoint;
  elapsedLabel: string;
  matchFound: boolean;
  canRelax: boolean;
  relaxDismissed: boolean;
  relaxRequesting: boolean;
  onRelax: () => void;
  onDismissRelax: () => void;
  onCancel: () => void;
}) {
  const breathingIn = useBreathingCycle();
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setLineIndex((i) => (i + 1) % REASSURANCE_LINES.length), REASSURANCE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="waiting-view">
      <Sanctuary mode="full" showControls={false} />
      <div className="waiting-orb">
        <span className="waiting-ring" />
        <span className="waiting-ring waiting-ring-late" />
        <Moodlight {...mood} size={140} layoutId="moodlight" />
      </div>
      <motion.p
        key={breathingIn ? "in" : "out"}
        className="waiting-breath-line"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {breathingIn ? "Breathe in with the light" : "And slowly let it go"}
      </motion.p>
      <h1 aria-live="polite">{matchFound ? "Say hello when you're ready" : "Finding someone who gets it"}</h1>
      {!matchFound && (
        <p>We&apos;re searching for {mode === "similar" ? "someone in a similar emotional place" : "a different, complementary headspace"}.</p>
      )}
      <div className="queue-card">
        <div>
          <span>You checked in as</span>
          <b>{emotion}</b>
        </div>
        <div>
          <span>Looking for</span>
          <b>{mode === "similar" ? "Someone who feels similar" : "A different headspace"}</b>
        </div>
      </div>
      {!matchFound && (
        <>
          <small className="wait">Waiting {elapsedLabel}</small>
          <motion.p
            key={lineIndex}
            className="waiting-reassurance"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {REASSURANCE_LINES[lineIndex]}
          </motion.p>
        </>
      )}
      {!matchFound && canRelax && !relaxDismissed && (
        <div className="relax-banner">
          <span>The kind of match you wanted isn&apos;t available right now, but others are waiting to connect.</span>
          <div>
            <MotionButton type="button" disabled={relaxRequesting} onClick={onRelax}>
              {relaxRequesting ? "Connecting…" : "Yes, connect me"}
            </MotionButton>
            <MotionButton type="button" className="text-button" disabled={relaxRequesting} onClick={onDismissRelax}>
              No, keep waiting
            </MotionButton>
          </div>
        </div>
      )}
      {!matchFound && (
        <MotionButton type="button" className="text-button cancel" onClick={onCancel}>
          Stop searching
        </MotionButton>
      )}
    </section>
  );
}
