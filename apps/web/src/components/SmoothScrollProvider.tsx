"use client";

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
 * Lenis is imported dynamically inside the effect (not as a top-level import)
 * so its ~12 KB gz does not land in the shared chunk every route eagerly
 * loads. It is only fetched on fine-pointer, motion-allowing desktops — the
 * single environment where it actually runs.
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

    let frameId = 0;
    let lenis: import("lenis").default | null = null;
    let cancelled = false;

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;

      lenis = new Lenis({
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

      const raf = (time: number) => {
        lenis?.raf(time);
        frameId = requestAnimationFrame(raf);
      };
      frameId = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
