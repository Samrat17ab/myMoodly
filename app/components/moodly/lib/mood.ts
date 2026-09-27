/**
 * Mood model for the redesign.
 * A mood is a point on a 2D field:
 *   x: 0 = "harder" (unpleasant)  ->  1 = "better" (pleasant)
 *   y: 0 = more energy (top)      ->  1 = less energy (bottom)
 */
export type Quadrant = 'bright' | 'settled' | 'stirred' | 'heavy';

/** The quadrant names the backend stores. */
export type BackendQuadrant = 'red' | 'yellow' | 'green' | 'blue';

export interface MoodPoint {
  x: number;
  y: number;
}

export const MOOD_HEX: Record<Quadrant, string> = {
  stirred: '#D9A08C', // unpleasant + high energy: muted ember
  bright: '#E8C98A', // pleasant + high energy: soft sun gold
  heavy: '#9DB0C4', // unpleasant + low energy: rain slate-blue
  settled: '#A9C9B4', // pleasant + low energy: fresh sage
};

export const QUADRANTS: Quadrant[] = ['stirred', 'bright', 'heavy', 'settled'];

export const QUADRANT_NAME: Record<Quadrant, string> = {
  bright: 'bright',
  settled: 'settled',
  stirred: 'stirred up',
  heavy: 'heavy',
};

export const QUADRANT_HINT: Record<Quadrant, string> = {
  bright: 'Maybe excited, hopeful, energised or playful.',
  settled: 'Maybe calm, content, relieved or at ease.',
  stirred: 'Maybe anxious, stressed, frustrated or restless.',
  heavy: 'Maybe tired, lonely, low or drained.',
};

export const QUADRANT_CENTER: Record<Quadrant, MoodPoint> = {
  stirred: { x: 0.25, y: 0.25 },
  bright: { x: 0.75, y: 0.25 },
  heavy: { x: 0.25, y: 0.75 },
  settled: { x: 0.75, y: 0.75 },
};

export const TO_BACKEND_QUADRANT: Record<Quadrant, BackendQuadrant> = {
  stirred: 'red',
  bright: 'yellow',
  settled: 'green',
  heavy: 'blue',
};
export const FROM_BACKEND_QUADRANT: Record<BackendQuadrant, Quadrant> = {
  red: 'stirred',
  yellow: 'bright',
  green: 'settled',
  blue: 'heavy',
};

const PINE = '#1E4D43';

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function mixHex(a: string, b: string, t: number): string {
  const A = toRgb(a);
  const B = toRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function clampPoint(p: MoodPoint, pad = 0.06): MoodPoint {
  return { x: clamp(p.x, pad, 1 - pad), y: clamp(p.y, pad, 1 - pad) };
}

/** Continuous colour blend across the four quadrant colours. */
export function moodColor(p: MoodPoint): string {
  const top = mixHex(MOOD_HEX.stirred, MOOD_HEX.bright, p.x);
  const bottom = mixHex(MOOD_HEX.heavy, MOOD_HEX.settled, p.x);
  return mixHex(top, bottom, p.y);
}

export function deepColor(hex: string, t = 0.4): string {
  return mixHex(hex, PINE, t);
}

export function quadrantOf(p: MoodPoint): Quadrant {
  if (p.y < 0.5) return p.x >= 0.5 ? 'bright' : 'stirred';
  return p.x >= 0.5 ? 'settled' : 'heavy';
}

/** 0 at the centre of the map, 1 near the corners. */
export function intensityOf(p: MoodPoint): number {
  return clamp(Math.hypot(p.x - 0.5, p.y - 0.5) / 0.6, 0, 1);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function describeMood(p: MoodPoint) {
  const quadrant = quadrantOf(p);
  const d = Math.hypot(p.x - 0.5, p.y - 0.5);
  const name = QUADRANT_NAME[quadrant];
  const label = d < 0.18 ? `A little ${name}` : d > 0.42 ? `Very ${name}` : cap(name);
  return { quadrant, label, hint: QUADRANT_HINT[quadrant] };
}

/** Maps the continuous point onto the binary values the backend stores. */
export function toBackendMood(p: MoodPoint) {
  return {
    energy: p.y < 0.5 ? ('high' as const) : ('low' as const),
    pleasantness: p.x >= 0.5 ? ('pleasant' as const) : ('unpleasant' as const),
  };
}
