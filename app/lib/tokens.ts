// TS mirror of app/styles/tokens.css motion values, for use with framer-motion
// (CSS custom properties can't be read into JS animation configs directly).

export const durations = {
  micro: 0.2,
  transition: 0.55,
  ambient: 8,
} as const;

export const easeEntrance = [0.22, 1, 0.36, 1] as const;

export const spring = {
  type: "spring" as const,
  stiffness: 120,
  damping: 22,
  mass: 1,
};

export const moodColors = {
  pleasantHigh: "#e8c98a",
  pleasantLow: "#a9c9b4",
  unpleasantHigh: "#d9a08c",
  unpleasantLow: "#9db0c4",
} as const;

export const palette = {
  pine: "#1e4d43",
  pineDeep: "#123730",
  sage: "#8fb3a3",
  mist: "#eef3ef",
  lichen: "#e6e1d2",
  dusk: "#c49a93",
  night: "#0f1d21",
} as const;
