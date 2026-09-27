export interface Star {
  x: number; // percent
  y: number; // percent
  r: number; // px
  d: number; // animation delay in seconds (negative)
}

/** Deterministic, so the server and client render the same sky. */
export function makeStars(count: number, seed = 7, maxY = 70): Star[] {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, () => ({
    x: +(rnd() * 100).toFixed(2),
    y: +(rnd() * maxY).toFixed(2),
    r: rnd() > 0.82 ? 3 : 2,
    d: -+(rnd() * 5).toFixed(2),
  }));
}
