"use client";
import type { MoodValue } from "./MoodMapField";
import { moodColor } from "./Moodlight";

const TILES: { label: string; hint: string; value: MoodValue }[] = [
  { label: "Angry", hint: "High energy, unpleasant", value: { pleasant: 0.2, energy: 0.8 } },
  { label: "Happy", hint: "High energy, pleasant", value: { pleasant: 0.8, energy: 0.8 } },
  { label: "Sad", hint: "Low energy, unpleasant", value: { pleasant: 0.2, energy: 0.2 } },
  { label: "Calm", hint: "Low energy, pleasant", value: { pleasant: 0.8, energy: 0.2 } },
];

/** Accessible fallback for the drag-based MoodMapField: four large tappable
 * quadrant tiles naming the broad feeling directly. */
export function QuadrantTiles({ onPick }: { onPick: (value: MoodValue) => void }) {
  return (
    <div className="quadrant-tiles">
      {TILES.map((tile) => (
        <button key={tile.label} type="button" onClick={() => onPick(tile.value)}>
          <span className="quadrant-dot" style={{ background: moodColor(tile.value) }} />
          <b>{tile.label}</b>
          <small>{tile.hint}</small>
        </button>
      ))}
    </div>
  );
}
