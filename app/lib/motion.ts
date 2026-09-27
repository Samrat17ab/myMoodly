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

// The server always renders as if motion were not reduced (there's no
// window to read prefers-reduced-motion from), so a client that *does*
// prefer reduced motion hydrates straight onto whatever `entrance.hidden`
// left in the DOM (opacity/y/blur included). If this target omitted y/filter,
// framer-motion would only ever touch opacity and leave the inherited blur
// stuck in place forever. Naming every property explicitly resets them.
export const reducedEntrance: Variants = {
  hidden: { opacity: 0, y: 0, filter: "blur(0px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: durations.micro } },
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
  enter: { opacity: 0, x: 0 },
  center: { opacity: 1, x: 0, transition: { duration: durations.micro } },
  exit: { opacity: 0, x: 0, transition: { duration: durations.micro } },
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
