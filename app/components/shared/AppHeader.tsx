"use client";
import { Brand } from "./Brand";
import { MotionButton } from "./MotionButton";
import { IconHelp } from "@/app/components/icons";

/** Persistent top bar on every signed-in screen except chat (which uses its
 * own minimal header so the conversation stays uncluttered). */
export function AppHeader({
  initials,
  onHome,
  onGuide,
  onHelp,
  onSettings,
}: {
  initials: string;
  onHome: () => void;
  onGuide: () => void;
  onHelp: () => void;
  onSettings: () => void;
}) {
  return (
    <header className="app-header">
      <MotionButton className="app-header-brand" onClick={onHome} aria-label="Home">
        <Brand />
      </MotionButton>
      <nav className="app-header-nav">
        <MotionButton className="text-button" onClick={onGuide}>
          Guide
        </MotionButton>
        <MotionButton className="app-help-pill" onClick={onHelp}>
          <IconHelp size={14} /> <span>Need help now?</span>
        </MotionButton>
        <MotionButton className="app-header-avatar" onClick={onSettings} aria-label="Account settings">
          {initials}
        </MotionButton>
      </nav>
    </header>
  );
}
