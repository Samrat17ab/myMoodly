"use client";
import { useState } from "react";
import type { Scene } from "./scenes";
import { IconScene, IconSound, IconSoundOff } from "@/app/components/icons";

export function SceneControls({
  scenes,
  currentId,
  pinned,
  movementOn,
  soundOn,
  onPick,
  onTogglePin,
  onToggleMovement,
  onToggleSound,
}: {
  scenes: Scene[];
  currentId: string;
  pinned: boolean;
  movementOn: boolean;
  soundOn: boolean;
  onPick: (id: string) => void;
  onTogglePin: () => void;
  onToggleMovement: () => void;
  onToggleSound: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sanctuary-controls">
        <button
          type="button"
          aria-label={soundOn ? "Turn ambient sound off" : "Turn ambient sound on"}
          onClick={onToggleSound}
        >
          {soundOn ? <IconSound size={16} /> : <IconSoundOff size={16} />}
        </button>
        <button type="button" aria-label="Scene settings" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <IconScene size={16} />
        </button>
      </div>
      {open && (
        <div className="sanctuary-picker" role="dialog" aria-label="Choose a scene">
          <button type="button" style={{ gridColumn: "1 / -1", fontSize: 11 }} onClick={onTogglePin}>
            {pinned ? "Unpin scene" : "Pin this scene"}
          </button>
          <button type="button" style={{ gridColumn: "1 / -1", fontSize: 11 }} onClick={onToggleMovement}>
            {movementOn ? "Turn movement off" : "Turn movement on"}
          </button>
          {scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className={scene.id === currentId ? "is-selected" : ""}
              style={{ background: scene.gradient }}
              title={scene.label}
              aria-label={scene.label}
              onClick={() => onPick(scene.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
