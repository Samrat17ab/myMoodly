"use client";
import type { RefObject } from "react";
import { StepFlow } from "@/app/components/shared/StepFlow";
import type { MoodPoint } from "@/app/components/shared/Moodlight";

const STARTER_CHIPS = ["Long day", "Can't sleep", "Good news to share"];

export function ContextStep({
  emotion,
  mood,
  note,
  setNote,
  noteRef,
  onContinue,
  onBack,
}: {
  emotion: string;
  mood: MoodPoint;
  note: string;
  setNote: (v: string) => void;
  noteRef: RefObject<HTMLTextAreaElement | null>;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <StepFlow step={4} onBack={onBack} mood={mood} wide>
      <div className="feeling-chip">
        You&apos;re feeling <b>{emotion}</b>
      </div>
      <div className="center-head">
        <h2>Want to add a little context?</h2>
        <p>Optional — just enough to help the conversation begin.</p>
      </div>
      <div className="starter-chips">
        {STARTER_CHIPS.map((chip) => (
          <button key={chip} type="button" onClick={() => setNote(chip)}>
            {chip}
          </button>
        ))}
      </div>
      <div className="note-box">
        <textarea
          ref={noteRef}
          maxLength={80}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="A few words about what's going on…"
        />
        <span>{note.length}/80</span>
      </div>
      <p className="privacy-note">Contact details are automatically removed to protect your privacy.</p>
      <button type="button" className="primary wide" onClick={onContinue}>
        {note ? "Continue" : "Skip for now"}
      </button>
    </StepFlow>
  );
}
