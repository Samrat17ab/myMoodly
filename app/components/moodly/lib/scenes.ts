import type { Quadrant } from './mood';

export type SceneFamily = 'dawn' | 'day' | 'golden' | 'night';
export type SceneId = 'dawn-lake' | 'day-meadow' | 'golden-shore' | 'night-aurora';
export type SceneTone = 'light' | 'dark';

export interface SceneMeta {
  id: SceneId;
  family: SceneFamily;
  title: string;
  /** light = dark text on a bright scene, dark = light text on a night scene */
  tone: SceneTone;
  audio: string;
  audioLabel: string;
  /** moods this scene suits best, most suitable first */
  affinity: Quadrant[];
}

/**
 * One scene per family ships now. To add more (misty forest, fern waterfall,
 * rain on leaves, snowy peaks): add a component in ../sanctuary/scenes,
 * register it in SceneView, and add an entry here. Rotation inside a family
 * starts working automatically once that family has 2+ scenes.
 */
export const SCENES: SceneMeta[] = [
  { id: 'dawn-lake', family: 'dawn', title: 'Dawn at the lake', tone: 'light', audio: '/sounds/dawn-lake.mp3', audioLabel: 'Birds and water', affinity: ['settled', 'heavy', 'bright', 'stirred'] },
  { id: 'day-meadow', family: 'day', title: 'Afternoon meadow', tone: 'light', audio: '/sounds/day-meadow.mp3', audioLabel: 'Birds and breeze', affinity: ['bright', 'settled', 'heavy', 'stirred'] },
  { id: 'golden-shore', family: 'golden', title: 'Golden hour on the shore', tone: 'light', audio: '/sounds/golden-shore.mp3', audioLabel: 'Slow waves', affinity: ['stirred', 'settled', 'bright', 'heavy'] },
  { id: 'night-aurora', family: 'night', title: 'Aurora over the ridge', tone: 'dark', audio: '/sounds/night-aurora.mp3', audioLabel: 'Crickets and wind', affinity: ['heavy', 'settled', 'stirred', 'bright'] },
];

/** How often to move to the next scene in the same family. */
export const ROTATE_MS = 180_000;

export function familyForDate(d: Date = new Date()): SceneFamily {
  const m = d.getHours() * 60 + d.getMinutes();
  if (m >= 300 && m < 480) return 'dawn'; // 05:00 - 08:00
  if (m >= 480 && m < 960) return 'day'; // 08:00 - 16:00
  if (m >= 960 && m < 1170) return 'golden'; // 16:00 - 19:30
  return 'night'; // 19:30 - 05:00
}

export function getScene(id: SceneId): SceneMeta {
  return SCENES.find((s) => s.id === id) ?? SCENES[1];
}

export function pickScene(family: SceneFamily, mood?: Quadrant, index = 0): SceneMeta {
  const list = SCENES.filter((s) => s.family === family);
  if (!list.length) return SCENES[1];
  if (mood) {
    const sorted = [...list].sort((a, b) => a.affinity.indexOf(mood) - b.affinity.indexOf(mood));
    return sorted[index % sorted.length];
  }
  return list[index % list.length];
}
