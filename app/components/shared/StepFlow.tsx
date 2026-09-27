"use client";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { IconBack } from "@/app/components/icons";
import { Moodlight, type MoodPoint } from "./Moodlight";
import { MotionButton } from "./MotionButton";
import { entrance, reducedEntrance } from "@/app/lib/motion";
import { useReducedMotionSafe } from "@/app/hooks/useReducedMotionSafe";

const TOTAL_STEPS = 4;

/** Consistent step indicator + a back button that sits in normal flex flow
 * (never absolutely overlapping the header, unlike the legacy .panel/.back
 * combination) for every check-in step. */
export function StepFlow({
  step,
  title,
  subtitle,
  onBack,
  mood,
  wide = false,
  className,
  children,
}: {
  step: number;
  title?: string;
  subtitle?: string;
  onBack: () => void;
  mood?: MoodPoint;
  wide?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotionSafe();
  return (
    <section className={`step-flow ${wide ? "step-flow-wide" : ""} ${className ?? ""}`}>
      <div className="step-flow-head">
        <MotionButton className="step-flow-back" onClick={onBack} aria-label="Back">
          <IconBack size={16} />
        </MotionButton>
        <div
          className="step-flow-progress"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label={`Step ${step} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <i key={i} className={i < step ? "on" : ""} />
          ))}
        </div>
        <div className="step-flow-head-end">{mood && <Moodlight {...mood} size={28} breathe={false} />}</div>
      </div>
      {(title || subtitle) && (
        <motion.div className="step-flow-copy" variants={reduced ? reducedEntrance : entrance} initial="hidden" animate="visible">
          {title && <h2>{title}</h2>}
          {subtitle && <p>{subtitle}</p>}
        </motion.div>
      )}
      {children}
    </section>
  );
}
