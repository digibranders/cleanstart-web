"use client";

import { useSyncExternalStore } from "react";

// Module-level scroll subscription. `useSyncExternalStore` reads `scrollY`
// synchronously before the first browser paint, so the header lands at the
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

function getSnapshot() {
  return window.scrollY;
}

function getServerSnapshot() {
  return 0;
}

export function useScrolled(threshold = 24): boolean {
  const scrollY = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return scrollY > threshold;
}
