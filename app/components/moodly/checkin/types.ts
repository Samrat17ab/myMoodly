import type { MoodPoint, Quadrant } from '../lib/mood';

export type Intent = 'similar' | 'different';

export interface CheckInPayload {
  /** continuous point, 0..1 each axis */
  point: MoodPoint;
  quadrant: Quadrant;
  /** the binary values the backend stores */
  energy: 'high' | 'low';
  pleasantness: 'pleasant' | 'unpleasant';
  word: string;
  note: string;
  intent: Intent;
}
