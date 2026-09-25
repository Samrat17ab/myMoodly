import type { Variants } from "framer-motion";
import { durations, easeEntrance } from "./tokens";

// One orchestrated entrance per screen: blur-to-sharp + small upward drift.
// `custom` is the stagger index (60-90ms apart).
export const entrance: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: durations.transition, ease: easeEntrance, delay: i * 0.07 },
  }),
};

export const reducedEntrance: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durations.micro } },
};

// Step-to-step transitions for the check-in flow: crossfade + horizontal
// drift in the direction of travel, reversed on back.
export const stepVariants: Variants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0, transition: { duration: durations.transition, ease: easeEntrance } },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction * -24,
    transition: { duration: durations.micro, ease: easeEntrance },
  }),
};

export const reducedStepVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: durations.micro } },
  exit: { opacity: 0, transition: { duration: durations.micro } },
};

export function haptic(ms = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      // ignore — vibration is a nicety, never load-bearing
    }
  }
}
