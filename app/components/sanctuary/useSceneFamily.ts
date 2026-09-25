"use client";
import { useEffect, useState } from "react";
import { familyForHour, type SceneFamily } from "./scenes";

const CHECK_INTERVAL_MS = 60 * 1000;

/** The user's local time-of-day family. Starts at "day" on the server/first
 * render (avoids an SSR/client hydration mismatch) and corrects itself to
 * the real local family right after mount. */
export function useSceneFamily(): SceneFamily {
  const [family, setFamily] = useState<SceneFamily>("day");

  useEffect(() => {
    const update = () => setFamily(familyForHour(new Date().getHours()));
    update();
    const id = setInterval(update, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return family;
}
