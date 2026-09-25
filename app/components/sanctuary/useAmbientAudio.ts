"use client";
import { useCallback, useEffect, useRef } from "react";
import { useStoredValue, writeStored } from "@/app/hooks/useStoredValue";

const STORAGE_KEY = "moodly:ambient-sound-enabled";
const TARGET_VOLUME = 0.3;
const FADE_MS = 3000;

/** Manages one looping ambient-audio element for the Sanctuary: off by
 * default, remembers the user's preference, fades in over 3s on first
 * enable, and crossfades when the scene (and so `src`) changes. No-ops
 * gracefully while `src` is undefined (placeholder scenes ship with no
 * audio file yet — see SCENES_README.md). */
export function useAmbientAudio(src: string | undefined, mutedByContext = false) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const enabled = useStoredValue(STORAGE_KEY) === "1";

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const fadeTo = useCallback((target: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    const start = performance.now();
    const from = audio.volume;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      audio.volume = from + (target - from) * t;
      if (t < 1) fadeRef.current = requestAnimationFrame(step);
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const active = enabled && !mutedByContext;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active || !src) {
      if (audio && !active) fadeTo(0);
      return;
    }
    if (!audio.src.endsWith(src)) {
      fadeTo(0);
      window.setTimeout(() => {
        audio.src = src;
        void audio.play().catch(() => {});
        fadeTo(TARGET_VOLUME);
      }, 400);
    } else if (audio.paused) {
      void audio.play().catch(() => {});
      fadeTo(TARGET_VOLUME);
    }
  }, [active, src, fadeTo]);

  const toggle = useCallback(() => {
    writeStored(STORAGE_KEY, enabled ? "0" : "1");
  }, [enabled]);

  return { enabled, toggle };
}
