"use client";
import { motion } from "framer-motion";
import { moodColors } from "@/app/lib/tokens";
import { useReducedMotionSafe } from "@/app/hooks/useReducedMotionSafe";

export type MoodPoint = {
  /** 0 = unpleasant, 1 = pleasant */
  pleasant: number;
  /** 0 = low energy, 1 = high energy */
  energy: number;
};

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Bilinear blend across the four mood-quadrant corners. */
export function moodColor({ pleasant, energy }: MoodPoint): string {
  const bl = hexToRgb(moodColors.unpleasantLow); // pleasant 0, energy 0
  const br = hexToRgb(moodColors.pleasantLow); // pleasant 1, energy 0
  const tl = hexToRgb(moodColors.unpleasantHigh); // pleasant 0, energy 1
  const tr = hexToRgb(moodColors.pleasantHigh); // pleasant 1, energy 1

  const bottom = {
    r: lerp(bl.r, br.r, pleasant),
    g: lerp(bl.g, br.g, pleasant),
    b: lerp(bl.b, br.b, pleasant),
  };
  const top = {
    r: lerp(tl.r, tr.r, pleasant),
    g: lerp(tl.g, tr.g, pleasant),
    b: lerp(tl.b, tr.b, pleasant),
  };
  const r = Math.round(lerp(bottom.r, top.r, energy));
  const g = Math.round(lerp(bottom.g, top.g, energy));
  const b = Math.round(lerp(bottom.b, top.b, energy));
  return `rgb(${r}, ${g}, ${b})`;
}

export function Moodlight({
  pleasant = 0.5,
  energy = 0.5,
  size = 96,
  breathe = true,
  layoutId = "moodlight",
  className,
}: MoodPoint & { size?: number; breathe?: boolean; layoutId?: string; className?: string }) {
  const reduced = useReducedMotionSafe();
  const color = moodColor({ pleasant, energy });
  const animateScale = breathe && !reduced;

  return (
    <motion.div
      layoutId={layoutId}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 38% 32%, color-mix(in srgb, ${color} 70%, white), ${color})`,
        boxShadow: `0 0 ${size * 0.5}px ${size * 0.14}px color-mix(in srgb, ${color} 35%, transparent)`,
      }}
      animate={
        animateScale
          ? { scale: [1, 1.05, 1], opacity: [0.94, 1, 0.94] }
          : { scale: 1, opacity: 1 }
      }
      transition={{
        scale: { duration: 5, repeat: animateScale ? Infinity : 0, ease: "easeInOut" },
        opacity: { duration: 5, repeat: animateScale ? Infinity : 0, ease: "easeInOut" },
        layout: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      }}
    />
  );
}
