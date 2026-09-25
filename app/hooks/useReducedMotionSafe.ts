"use client";
import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

type NetworkConnection = EventTarget & { saveData?: boolean };

function getConnection() {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkConnection }).connection;
}

function subscribe(callback: () => void) {
  const connection = getConnection();
  connection?.addEventListener("change", callback);
  return () => connection?.removeEventListener("change", callback);
}

function getSnapshot() {
  return Boolean(getConnection()?.saveData);
}

function getServerSnapshot() {
  return false;
}

// True when the user asked for reduced motion OR their connection is in
// data-saver mode — the Sanctuary and step transitions both fall back to
// simple fades/no-motion in either case.
export function useReducedMotionSafe() {
  const prefersReduced = useReducedMotion();
  const saveData = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return Boolean(prefersReduced) || saveData;
}
