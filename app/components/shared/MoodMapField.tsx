"use client";
import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Moodlight, moodColor } from "./Moodlight";
import { spring } from "@/app/lib/tokens";

export type MoodValue = { pleasant: number; energy: number };

const STEP = 0.05;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function describe(value: MoodValue) {
  const energy = value.energy >= 0.5 ? "buzzing" : "quiet";
  const pleasant = value.pleasant >= 0.5 ? "good" : "difficult";
  return `${energy} energy, feeling ${pleasant}`;
}

/** The 2D mood field: drag, tap, or focus it and use the arrow keys to place
 * the Moodlight. pleasant: 0 = difficult, 1 = good. energy: 0 = quiet,
 * 1 = buzzing. Fully keyboard-operable with a visible focus ring. */
export function MoodMapField({
  value,
  onChange,
  size = 280,
  layoutId,
}: {
  value: MoodValue;
  onChange: (value: MoodValue) => void;
  size?: number;
  layoutId?: string;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = fieldRef.current?.getBoundingClientRect();
      if (!rect) return;
      onChange({
        pleasant: clamp01((clientX - rect.left) / rect.width),
        energy: clamp01(1 - (clientY - rect.top) / rect.height),
      });
    },
    [onChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const deltas: Record<string, MoodValue> = {
      ArrowUp: { pleasant: 0, energy: STEP },
      ArrowDown: { pleasant: 0, energy: -STEP },
      ArrowLeft: { pleasant: -STEP, energy: 0 },
      ArrowRight: { pleasant: STEP, energy: 0 },
    };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();
    onChange({
      pleasant: clamp01(value.pleasant + delta.pleasant),
      energy: clamp01(value.energy + delta.energy),
    });
  };

  return (
    <div className="mood-map" style={{ width: size }}>
      <div className="mood-map-axis mood-map-axis-energy" aria-hidden>
        <span>buzzing</span>
        <span>quiet</span>
      </div>
      <div
        ref={fieldRef}
        className="mood-map-field"
        role="slider"
        tabIndex={0}
        aria-label="Mood: energy and pleasantness"
        aria-valuetext={describe(value)}
        aria-valuenow={Math.round(value.pleasant * 100)}
        style={{ width: size, height: size, background: moodFieldGradient() }}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromPoint(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          updateFromPoint(e.clientX, e.clientY);
        }}
      >
        <motion.div
          className="mood-map-marker"
          style={{
            left: `${value.pleasant * 100}%`,
            top: `${(1 - value.energy) * 100}%`,
          }}
          transition={spring}
        >
          <Moodlight pleasant={value.pleasant} energy={value.energy} size={44} breathe={false} layoutId={layoutId} />
        </motion.div>
      </div>
      <div className="mood-map-axis mood-map-axis-pleasant" aria-hidden>
        <span>difficult</span>
        <span>good</span>
      </div>
    </div>
  );
}

function moodFieldGradient() {
  const tl = moodColor({ pleasant: 0, energy: 1 });
  const tr = moodColor({ pleasant: 1, energy: 1 });
  const bl = moodColor({ pleasant: 0, energy: 0 });
  const br = moodColor({ pleasant: 1, energy: 0 });
  return `linear-gradient(to bottom right, ${tl}, transparent), linear-gradient(to bottom left, ${tr}, transparent), linear-gradient(to top right, ${bl}, transparent), linear-gradient(to top left, ${br}, transparent)`;
}
