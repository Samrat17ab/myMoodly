"use client";
import { useEffect, useState } from "react";

const BREATHE_IN_MS = 4000;
const BREATHE_OUT_MS = 6000;

/** True while "breathing in" (4s), false while "breathing out" (6s), looping. */
export function useBreathingCycle() {
  const [breathingIn, setBreathingIn] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setBreathingIn((v) => !v), breathingIn ? BREATHE_IN_MS : BREATHE_OUT_MS);
    return () => clearTimeout(id);
  }, [breathingIn]);

  return breathingIn;
}
