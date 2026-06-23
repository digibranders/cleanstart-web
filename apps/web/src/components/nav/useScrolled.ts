"use client";

import { useCallback, useSyncExternalStore } from "react";

// Module-level scroll subscription. `useSyncExternalStore` reads the scrolled
// state synchronously before the first browser paint, so the header lands at the
// correct solid/transparent state on back navigation and bfcache restores —
// no transient transparent flash over real content.

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("scroll", cb, { passive: true });
  // `pageshow` with `persisted === true` fires on bfcache restore; treat the
  // event itself as a scroll tick so the component re-reads `scrollY` after
  // the browser has applied scroll restoration.
  window.addEventListener("pageshow", cb);
  return () => {
    window.removeEventListener("scroll", cb);
    window.removeEventListener("pageshow", cb);
  };
}

export function useScrolled(threshold = 24): boolean {
  // Snapshot the derived boolean — not raw `scrollY` — so `useSyncExternalStore`
  // bails out of re-rendering on every scroll frame and only re-renders the
  // header at the two threshold crossings. The `cb` still fires per tick, but
  // an unchanged boolean is a no-op for React reconciliation.
  const getSnapshot = useCallback(() => window.scrollY > threshold, [threshold]);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
