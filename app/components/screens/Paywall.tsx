"use client";
import { useEffect, useState } from "react";
import { Moodlight } from "@/app/components/shared/Moodlight";
import { IconBack } from "@/app/components/icons";
import { nextResetLocalLabel } from "@/app/lib/time";

export function Paywall({ onBack }: { onBack: () => void }) {
  // Safe default until the client corrects it to the viewer's real timezone.
  const [resetLabel, setResetLabel] = useState("midnight");

  useEffect(() => {
    const readLocalReset = () => setResetLabel(nextResetLocalLabel());
    readLocalReset();
  }, []);

  return (
    <section className="paywall">
      <button type="button" className="back" onClick={onBack} aria-label="Back">
        <IconBack size={16} />
      </button>
      <div className="pay-visual">
        <Moodlight pleasant={0.6} energy={0.35} size={80} breathe={false} />
      </div>
      <h1>You&apos;ve used today&apos;s free connections.</h1>
      <p>
        Everyone gets 10 conversations a day. Yours will be back at {resetLabel} your time — in the meantime, the
        breathing moment on your home screen is there whenever you want it.
      </p>
    </section>
  );
}
