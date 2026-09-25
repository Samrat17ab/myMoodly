"use client";
import { moodColor } from "./Moodlight";

const TILES: { label: string; hint: string; energy: "high" | "low"; pleasant: boolean }[] = [
  { label: "Angry", hint: "High energy, unpleasant", energy: "high", pleasant: false },
  { label: "Happy", hint: "High energy, pleasant", energy: "high", pleasant: true },
  { label: "Sad", hint: "Low energy, unpleasant", energy: "low", pleasant: false },
  { label: "Calm", hint: "Low energy, pleasant", energy: "low", pleasant: true },
];

/** Accessible fallback for the drag-based MoodMapField: four large tappable
 * quadrant tiles naming the broad feeling directly. */
export function QuadrantTiles({ onPick }: { onPick: (energy: "high" | "low", pleasant: boolean) => void }) {
  return (
    <div className="quadrant-tiles">
      {TILES.map((tile) => (
        <button key={tile.label} type="button" onClick={() => onPick(tile.energy, tile.pleasant)}>
          <span
            className="quadrant-dot"
            style={{ background: moodColor({ pleasant: tile.pleasant ? 0.8 : 0.2, energy: tile.energy === "high" ? 0.8 : 0.2 }) }}
          />
          <b>{tile.label}</b>
          <small>{tile.hint}</small>
        </button>
      ))}
    </div>
  );
}
