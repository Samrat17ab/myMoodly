"use client";
import { motion } from "framer-motion";
import { Moodlight } from "@/app/components/shared/Moodlight";
import { useBreathingCycle } from "@/app/hooks/useBreathingCycle";
import { useReducedMotionSafe } from "@/app/hooks/useReducedMotionSafe";

// 4s in + 6s out, matching useBreathingCycle exactly so the ring/orb motion
// and the "Breathe in/out" label never drift apart.
const CYCLE_SECONDS = 10;
const RING_COUNT = 3;
const SPARK_COUNT = 6;

function seeded(i: number) {
  return ((i + 1) * 2654435761) % 1000 / 1000;
}

export function BreathingMoment({
  secondsLeft,
  onActivate,
}: {
  secondsLeft: number | null;
  onActivate: () => void;
}) {
  const breathingIn = useBreathingCycle();
  const reduced = useReducedMotionSafe();

  return (
    <button type="button" className="breathing-moment" onClick={onActivate} aria-label="Start a one-minute guided breath">
      <div className="breathing-glow" />
      <div className="breathing-sparks" aria-hidden>
        {Array.from({ length: SPARK_COUNT }).map((_, i) => (
          <span
            key={i}
            className="breathing-spark"
            style={{
              top: `${10 + seeded(i) * 75}%`,
              left: `${8 + seeded(i + 9) * 84}%`,
              animationDelay: `${seeded(i + 3) * CYCLE_SECONDS}s`,
            }}
          />
        ))}
      </div>
      <div className="breathing-orb-stage">
        {!reduced &&
          Array.from({ length: RING_COUNT }).map((_, i) => (
            <motion.span
              key={i}
              className="breathing-ring"
              initial={{ opacity: 0 }}
              animate={{ scale: [1, 2.5], opacity: [0.55, 0] }}
              transition={{
                duration: CYCLE_SECONDS,
                repeat: Infinity,
                delay: (i * CYCLE_SECONDS) / RING_COUNT,
                ease: "easeOut",
              }}
            />
          ))}
        <motion.div
          className="breathing-orb"
          animate={reduced ? { scale: 1 } : { scale: [1, 1.24, 1] }}
          transition={reduced ? { duration: 0 } : { duration: CYCLE_SECONDS, times: [0, 0.4, 1], repeat: Infinity, ease: "easeInOut" }}
        >
          <Moodlight layoutId="moodlight" size={104} pleasant={0.75} energy={0.3} breathe={false} />
        </motion.div>
      </div>
      <span className="breathing-caption">{secondsLeft === null ? "Take a moment" : `${secondsLeft}s left`}</span>
      <motion.b
        key={breathingIn ? "in" : "out"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {breathingIn ? "Breathe in" : "Breathe out"}
      </motion.b>
    </button>
  );
}
