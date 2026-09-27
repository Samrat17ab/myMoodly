"use client";
import type { RefObject } from "react";
import { StepFlow } from "@/app/components/shared/StepFlow";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { Moodlight, type MoodPoint } from "@/app/components/shared/Moodlight";
import { IconDifferent, IconSimilar } from "@/app/components/icons";
import { readMood } from "@/app/lib/moodQuadrant";

const STARTER_CHIPS = ["Long day", "Can't switch off", "Just need to vent"];

/** The last check-in step: merges the old separate note and "who to talk
 * to" steps into one screen, matching the design reference's 3-step flow
 * (mood, word, details) instead of splitting them into a 4th step. */
export function DetailsStep({
  emotion,
  mood,
  note,
  setNote,
  noteRef,
  mode,
  setMode,
  usage,
  onSubmit,
  onBack,
}: {
  emotion: string;
  mood: MoodPoint;
  note: string;
  setNote: (v: string) => void;
  noteRef: RefObject<HTMLTextAreaElement | null>;
  mode: "similar" | "different";
  setMode: (m: "similar" | "different") => void;
  usage: number;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const { quadrant } = readMood(mood);
  return (
    <StepFlow step={3} onBack={onBack} className="step-flow-details">
      <div className="mood-chip mood-chip-left">
        <Moodlight {...mood} size={28} breathe />
        <span>{emotion ? `Feeling ${emotion.toLowerCase()}` : quadrant}</span>
      </div>
      <h1 className="details-title">Anything you&apos;d like them to know?</h1>

      <label htmlFor="note" className="details-note-label">
        Optional. A few words help the conversation start gently.
      </label>
      <div className="note-box">
        <textarea
          id="note"
          ref={noteRef}
          maxLength={80}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Exam tomorrow and my head won't slow down"
        />
        <span>{note.length}/80</span>
      </div>
      <div className="starter-chips details-starters">
        {STARTER_CHIPS.map((chip) => (
          <MotionButton key={chip} onClick={() => setNote(chip)}>
            {chip}
          </MotionButton>
        ))}
        <span className="details-privacy">Phone numbers, emails and links are removed.</span>
      </div>

      <h2 className="details-who-title">Who would feel right to talk to?</h2>
      <div className="who-grid" role="radiogroup" aria-label="Who would feel right to talk to?">
        <MotionButton
          type="button"
          role="radio"
          aria-checked={mode === "similar"}
          className={`who-choice${mode === "similar" ? " is-on" : ""}`}
          onClick={() => setMode("similar")}
        >
          <IconSimilar size={40} />
          <span className="who-choice-text">
            <b>Someone who feels similar</b>
            <small>Be met by someone in a close place. Less explaining, more understanding.</small>
          </span>
        </MotionButton>
        <MotionButton
          type="button"
          role="radio"
          aria-checked={mode === "different"}
          className={`who-choice${mode === "different" ? " is-on" : ""}`}
          onClick={() => setMode("different")}
        >
          <IconDifferent size={40} />
          <span className="who-choice-text">
            <b>Someone in a different headspace</b>
            <small>A calmer or brighter view can help you step back from it.</small>
          </span>
        </MotionButton>
      </div>

      <div className="details-submit">
        <MotionButton className="primary large" onClick={onSubmit}>
          Find someone
        </MotionButton>
        <span className="details-remaining">{Math.max(0, 10 - usage)} conversations left today</span>
      </div>
    </StepFlow>
  );
}
