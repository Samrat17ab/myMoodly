'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Quadrant } from '../lib/mood';
import { familyForDate, getScene, pickScene, ROTATE_MS, type SceneFamily, type SceneId, type SceneMeta } from '../lib/scenes';
import { useAmbientAudio } from './useAmbientAudio';

interface SanctuaryState {
  /** false until mounted on the client; the scene depends on the user's local clock */
  ready: boolean;
  scene: SceneMeta;
  family: SceneFamily;
  mood?: Quadrant;
  setMood: (q?: Quadrant) => void;
  pinned: SceneId | null;
  setPinned: (id: SceneId | null) => void;
  soundOn: boolean;
  toggleSound: () => void;
  still: boolean;
  setStill: (v: boolean) => void;
  /** tab hidden: every animation and sound pauses */
  paused: boolean;
}

const Ctx = createContext<SanctuaryState | null>(null);

const read = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string | null) => {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, v);
  } catch {
    /* private mode */
  }
};

export function SanctuaryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [family, setFamily] = useState<SceneFamily>('day');
  const [mood, setMood] = useState<Quadrant | undefined>();
  const [pinned, setPinnedState] = useState<SceneId | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [still, setStillState] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);

  // Mount: read the clock and saved preferences.
  useEffect(() => {
    const readMountState = () => {
      setFamily(familyForDate());
      setPinnedState((read('mm:scene') as SceneId | null) ?? null);
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      setStillState(read('mm:still') === '1' || !!conn?.saveData);
      // Sound always starts off. We never auto-resume it on a new visit.
      setReady(true);
    };
    readMountState();
    const clock = window.setInterval(() => setFamily(familyForDate()), 60_000);
    return () => window.clearInterval(clock);
  }, []);

  // Slow rotation within the family, never while the person is typing.
  useEffect(() => {
    if (!ready || pinned) return;
    const id = window.setInterval(() => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (!typing && document.visibilityState === 'visible') setIndex((i) => i + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [ready, pinned]);

  useEffect(() => {
    const onVis = () => setPaused(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const scene = pinned ? getScene(pinned) : pickScene(family, mood, index);

  // Theme tokens follow the scene: night scenes switch the UI to light-on-dark.
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.tone = scene.tone;
    root.dataset.scene = scene.family;
  }, [ready, scene.tone, scene.family]);

  useAmbientAudio(scene.audio, scene.id, ready && soundOn && !paused);

  const setPinned = useCallback((id: SceneId | null) => {
    setPinnedState(id);
    write('mm:scene', id);
  }, []);
  const setStill = useCallback((v: boolean) => {
    setStillState(v);
    write('mm:still', v ? '1' : null);
  }, []);
  const toggleSound = useCallback(() => setSoundOn((s) => !s), []);

  const value = useMemo<SanctuaryState>(
    () => ({ ready, scene, family, mood, setMood, pinned, setPinned, soundOn, toggleSound, still, setStill, paused }),
    [ready, scene, family, mood, pinned, setPinned, soundOn, toggleSound, still, setStill, paused],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSanctuary(): SanctuaryState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSanctuary must be used inside <SanctuaryProvider>');
  return ctx;
}
