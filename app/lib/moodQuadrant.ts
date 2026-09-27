import type { MoodValue } from "@/app/components/shared/MoodMapField";

const QUADRANT_HINT: Record<string, string> = {
  Angry: "Maybe anxious, stressed, frustrated or restless.",
  Happy: "Maybe excited, hopeful, energised or playful.",
  Calm: "Maybe content, relieved or at ease.",
  Sad: "Maybe tired, lonely, low or drained.",
};

/** Quadrant name + intensity qualifier ("A little angry" / "Very happy"),
 * matching the app's existing red/yellow/green/blue -> Angry/Happy/Sad/Calm
 * naming used everywhere else (QuadrantTiles, QuadrantFallbackStep). */
export function readMood(value: MoodValue) {
  const energyHigh = value.energy >= 0.5;
  const pleasant = value.pleasant >= 0.5;
  const quadrant = energyHigh ? (pleasant ? "Happy" : "Angry") : pleasant ? "Calm" : "Sad";
  const d = Math.hypot(value.pleasant - 0.5, value.energy - 0.5);
  const level = d < 0.18 ? "A little " : d > 0.42 ? "Very " : "";
  return { quadrant, label: `${level}${level ? quadrant.toLowerCase() : quadrant}`, hint: QUADRANT_HINT[quadrant] };
}
