"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Hydration-safe reduced-motion flag. Use it instead of motion's
 * `useReducedMotion` whenever the value changes render output.
 *
 * motion's hook reads the media query during the first client render, so a
 * reduced-motion visitor hydrates different markup than the server sent. React
 * then logs a mismatch, or for structural differences discards the server HTML
 * and re-renders the whole Suspense boundary on the client. This hook hydrates
 * with the server snapshot (`false`) and re-renders with the real value
 * straight after, so SSR and the hydration render always agree.
 */
export function useHydratedReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
