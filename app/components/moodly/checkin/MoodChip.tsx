'use client';

import { Moodlight } from '../Moodlight';
import { moodColor, type MoodPoint } from '../lib/mood';

/** Small chip with the travelling Moodlight: "Feeling overwhelmed". */
export function MoodChip({ point, text }: { point: MoodPoint; text: string }) {
  return (
    <div className="mm-moodchip">
      <Moodlight color={moodColor(point)} size={30} halo={false} layoutId="mm-checkin-light" />
      <span>{text}</span>
    </div>
  );
}
