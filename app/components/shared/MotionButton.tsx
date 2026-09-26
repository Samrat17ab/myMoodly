"use client";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";

// A handful of native event props share a name with framer-motion's own
// gesture props but have incompatible signatures (onDrag, onAnimation*).
type SafeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

/** Every interactive choice in the app (check-in tiles, primary CTAs, word
 * pills) gets the same real spring-physics feedback instead of a flat CSS
 * transition -- lift + scale on hover, a snappy press on tap. */
export function MotionButton({ children, ...props }: SafeButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.96, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
