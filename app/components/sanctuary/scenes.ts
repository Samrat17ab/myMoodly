export type SceneFamily = "dawn" | "day" | "golden" | "night";
export type MoodAffinity = "pleasant-high" | "pleasant-low" | "unpleasant-high" | "unpleasant-low";
export type OverlayKind = "clouds" | "stars" | "aurora" | "mist" | "fireflies" | "rain" | "birds" | "grass";

export type Scene = {
  id: string;
  family: SceneFamily;
  /** Shown in the scene picker. */
  label: string;
  moodAffinity: MoodAffinity[];
  /** Placeholder "poster" until real photography is dropped in — see SCENES_README.md. */
  gradient: string;
  overlays: OverlayKind[];
  /** Future real assets — absent until sourced per SCENES_README.md. */
  poster?: string;
  video?: string;
  ambientAudio?: string;
  credit?: string;
};

// Single config value for how often the Sanctuary rotates to the next scene
// in the current family, per the brief's "make the interval a single config
// value" instruction.
export const SCENE_ROTATION_MS = 3 * 60 * 1000;
export const CROSSFADE_MS = 5000;

export const SCENES: Scene[] = [
  // Dawn — 05:00-08:00
  {
    id: "dawn-mist-lake",
    family: "dawn",
    label: "Mist over a mountain lake",
    moodAffinity: ["pleasant-low", "unpleasant-low"],
    gradient:
      "linear-gradient(180deg, #f3c9a0 0%, #e7b7a3 22%, #cfd9c9 46%, #aebfb6 68%, #8fa79c 100%)",
    overlays: ["mist", "birds"],
  },
  {
    id: "dawn-snow-peaks",
    family: "dawn",
    label: "First sun on snowy peaks",
    moodAffinity: ["pleasant-high"],
    gradient:
      "linear-gradient(180deg, #f7d9b0 0%, #eec2a8 28%, #d7c3c6 50%, #b7c6cf 75%, #93a9ad 100%)",
    overlays: ["clouds"],
  },
  {
    id: "dawn-pine-valley",
    family: "dawn",
    label: "Fog in a pine valley",
    moodAffinity: ["unpleasant-low"],
    gradient:
      "linear-gradient(180deg, #cdd7c8 0%, #b9c6bd 30%, #9fb0a6 55%, #798d84 80%, #5f7168 100%)",
    overlays: ["mist"],
  },

  // Day — 08:00-16:00
  {
    id: "day-meadow-horses",
    family: "day",
    label: "A wide green meadow",
    moodAffinity: ["pleasant-high"],
    gradient:
      "linear-gradient(180deg, #bcdcef 0%, #cfe6d8 42%, #9fc79f 70%, #7fae83 100%)",
    overlays: ["clouds", "grass", "birds"],
  },
  {
    id: "day-forest-canopy",
    family: "day",
    label: "Sunlight through the canopy",
    moodAffinity: ["pleasant-low"],
    gradient:
      "linear-gradient(180deg, #d8e7b7 0%, #a9c98f 35%, #6f9a6a 65%, #3f6b4d 100%)",
    overlays: ["birds"],
  },
  {
    id: "day-clear-sky",
    family: "day",
    label: "Clear sky, birds gliding high",
    moodAffinity: ["pleasant-high"],
    gradient: "linear-gradient(180deg, #a9d2ea 0%, #c7e2e0 45%, #dcebd6 100%)",
    overlays: ["birds", "clouds"],
  },
  {
    id: "day-rain-leaves",
    family: "day",
    label: "Gentle rain on leaves",
    moodAffinity: ["unpleasant-low"],
    gradient:
      "linear-gradient(180deg, #b7c6c2 0%, #97ac9f 38%, #71897a 70%, #4f6657 100%)",
    overlays: ["rain", "mist"],
  },

  // Golden — 16:00-19:30
  {
    id: "golden-rolling-hills",
    family: "golden",
    label: "Warm light over the hills",
    moodAffinity: ["pleasant-high"],
    gradient:
      "linear-gradient(180deg, #f3d9a4 0%, #eab98a 32%, #d99e78 58%, #b98467 100%)",
    overlays: ["grass", "clouds"],
  },
  {
    id: "golden-ocean-shore",
    family: "golden",
    label: "Calm shore, slow waves",
    moodAffinity: ["unpleasant-high"],
    gradient:
      "linear-gradient(180deg, #f2c9a3 0%, #e2ab8f 30%, #b8a08c 55%, #6f8896 80%, #4c6c7c 100%)",
    overlays: [],
  },
  {
    id: "golden-fern-waterfall",
    family: "golden",
    label: "A waterfall in a fern valley",
    moodAffinity: ["unpleasant-high"],
    gradient:
      "linear-gradient(180deg, #dfd2a0 0%, #b9c79b 32%, #7fa484 62%, #4d7566 100%)",
    overlays: ["mist"],
  },
  {
    id: "golden-fireflies-meadow",
    family: "golden",
    label: "Fireflies as dusk settles",
    moodAffinity: ["pleasant-low"],
    gradient:
      "linear-gradient(180deg, #d9b791 0%, #b38f7c 32%, #6f6a6f 62%, #3c3f52 100%)",
    overlays: ["fireflies", "grass"],
  },

  // Night — 19:30-05:00
  {
    id: "night-starry-mountains",
    family: "night",
    label: "A sky full of stars",
    moodAffinity: ["pleasant-low"],
    gradient: "linear-gradient(180deg, #0f1d2b 0%, #142430 40%, #223a3a 75%, #2c463f 100%)",
    overlays: ["stars"],
  },
  {
    id: "night-aurora-ridge",
    family: "night",
    label: "Slow aurora over a ridge",
    moodAffinity: ["pleasant-low"],
    gradient: "linear-gradient(180deg, #0b1a22 0%, #10262b 45%, #17332f 75%, #1e3d33 100%)",
    overlays: ["aurora", "stars"],
  },
  {
    id: "night-moonlit-lake",
    family: "night",
    label: "A still, moonlit lake",
    moodAffinity: ["unpleasant-low", "pleasant-low"],
    gradient: "linear-gradient(180deg, #101d2a 0%, #16262f 40%, #223531 72%, #2b3f36 100%)",
    overlays: ["stars", "fireflies"],
  },
];

export function scenesForFamily(family: SceneFamily) {
  return SCENES.filter((s) => s.family === family);
}

export function familyForHour(hour: number): SceneFamily {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 16) return "day";
  if (hour >= 16 && hour < 19.5) return "golden";
  return "night";
}

/** Picks the next scene, biased toward the user's mood quadrant when given,
 * preferring to stay within the current time family. */
export function pickScene(family: SceneFamily, mood?: MoodAffinity, excludeId?: string): Scene {
  const inFamily = scenesForFamily(family);
  const pool = mood ? inFamily.filter((s) => s.moodAffinity.includes(mood)) : inFamily;
  const candidates = (pool.length ? pool : inFamily).filter((s) => s.id !== excludeId);
  const finalPool = candidates.length ? candidates : inFamily;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
