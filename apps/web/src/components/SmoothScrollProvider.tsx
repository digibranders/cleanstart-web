"use client";

import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";

/**
 * Wraps the page in a Lenis-driven smooth-scroll loop.
 *
 * Lenis intercepts wheel/touch events and animates `window.scrollY` with an
 * easing curve, so the entire page scroll feels eased and momentum-based
 * instead of the browser's native snap-to-pixel behavior. Reveal animations
 * (FadeUp, useInView, etc.) feel premium because the scroll velocity that
 * triggers them is itself smooth.
 *
 * Guards:
 *  - `prefers-reduced-motion: reduce` → disable entirely (accessibility).
 *  - Coarse pointers (touch devices with their own native momentum) → also
 *    disabled, since iOS Safari's native scroll fights Lenis and feels worse.
 *  - On unmount → Lenis is destroyed and native scroll is restored.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (reduceMotion || coarsePointer) return;

    const lenis = new Lenis({
      duration: 1.2,
      // easeOutExpo — fast at first, gently lands at the target.
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    let frameId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
