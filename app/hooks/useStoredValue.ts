"use client";
import { useSyncExternalStore } from "react";

// A tiny localStorage-backed store readable via useSyncExternalStore (so it's
// safe for SSR/hydration and never needs a setState-in-effect to restore its
// initial value) with a same-tab notification path, since the browser's
// native "storage" event only fires in *other* tabs.
const sameTabListeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  sameTabListeners.get(key)?.forEach((cb) => cb());
}

function subscribe(key: string) {
  return (callback: () => void) => {
    let set = sameTabListeners.get(key);
    if (!set) {
      set = new Set();
      sameTabListeners.set(key, set);
    }
    set.add(callback);
    window.addEventListener("storage", callback);
    return () => {
      set?.delete(callback);
      window.removeEventListener("storage", callback);
    };
  };
}

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage can throw in private/blocked contexts — the preference just won't persist
  }
  notify(key);
}

function getServerSnapshot() {
  return null;
}

/** The current value of a localStorage key, `null` on the server and until read. */
export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(subscribe(key), () => readStored(key), getServerSnapshot);
}
