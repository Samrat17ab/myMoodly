'use client';

import { useEffect } from 'react';

const TARGET_VOLUME = 0.3;

function fadeTo(audio: HTMLAudioElement, to: number, ms: number, done?: () => void) {
  const from = audio.volume;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    audio.volume = from + (to - from) * t;
    if (t < 1) requestAnimationFrame(tick);
    else done?.();
  };
  requestAnimationFrame(tick);
}

/**
 * Plays one looping ambient track. Changing `src` crossfades (the old track
 * fades out while the new one fades in). Sound is always opt-in: the caller
 * only passes enabled=true after the user turned it on, which also satisfies
 * browser autoplay rules.
 */
export function useAmbientAudio(src: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = 'auto';
    let alive = true;
    audio
      .play()
      .then(() => alive && fadeTo(audio, TARGET_VOLUME, 3000))
      .catch(() => {
        /* missing file or blocked: stay silent */
      });
    return () => {
      alive = false;
      fadeTo(audio, 0, 1500, () => {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      });
    };
  }, [src, enabled]);
}
