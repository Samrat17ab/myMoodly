'use client';

import { useEffect } from 'react';
import type { SceneId } from '../lib/scenes';
import { startAmbientSynth } from './ambientSynth';

const TARGET_VOLUME = 0.3;
const FADE_IN_MS = 3000;
const FADE_OUT_MS = 1500;

let sharedContext: AudioContext | null = null;
function audioContext() {
  if (!sharedContext) {
    const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    sharedContext = new Ctor();
  }
  return sharedContext;
}

/** True when `src` is a real audio file (a missing path returns the app's HTML). */
async function hasRecording(src: string) {
  try {
    const res = await fetch(src, { method: 'HEAD' });
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('audio/');
  } catch {
    return false;
  }
}

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
 * Plays one looping ambient track for the scene: the recording at `src` when
 * it exists, otherwise generated ambience. Changing scene crossfades. Sound
 * is always opt-in: the caller only passes enabled=true after the user turned
 * it on, which also satisfies browser autoplay rules.
 */
export function useAmbientAudio(src: string, scene: SceneId, enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    let alive = true;
    let stop: (() => void) | null = null;

    const playGenerated = () => {
      const ctx = audioContext();
      if (!ctx) return;
      void ctx.resume();
      const voice = startAmbientSynth(ctx, scene, TARGET_VOLUME, FADE_IN_MS);
      stop = () => voice.stop(FADE_OUT_MS);
    };

    const playRecording = () => {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          if (alive) fadeTo(audio, TARGET_VOLUME, FADE_IN_MS);
        })
        .catch(() => {
          if (alive) playGenerated();
        });
      stop = () =>
        fadeTo(audio, 0, FADE_OUT_MS, () => {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        });
    };

    // Start generated sound straight away (while the click still counts as a
    // user gesture); switch to the recording only if one exists.
    playGenerated();
    void hasRecording(src).then((found) => {
      if (!alive || !found) return;
      stop?.();
      playRecording();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [src, scene, enabled]);
}
