"use client";

import { useEffect, useRef } from "react";

/**
 * The footer signature: the vector wordmark at container width in a band
 * that is pinned to the viewport bottom (`.cs-footer-signature`, sticky)
 * underneath the opaque footer body. The body is the curtain: as its bottom
 * edge lifts off the viewport bottom, the wordmark is revealed beneath it,
 * drifting up at half the scroll speed until it sits in normal flow at the
 * end of the page.
 *
 * Progress is the fraction of the band's height that is exposed below the
 * body: `(viewport height - body bottom) / band height`, clamped to 0..1, on
 * a rAF-throttled scroll listener. No easing and no smoothing: the wordmark
 * tracks the scroll position exactly.
 */
export function FooterSignature() {
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const curtain = band.previousElementSibling;
    if (!(curtain instanceof HTMLElement)) return;

    let pending = false;

    const update = () => {
      const exposed = window.innerHeight - curtain.getBoundingClientRect().bottom;
      const progress = Math.min(1, Math.max(0, exposed / band.offsetHeight));
      band.style.setProperty("--cs-signature-progress", progress.toFixed(4));
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        update();
        pending = false;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      band.style.removeProperty("--cs-signature-progress");
    };
  }, []);

  return (
    <div ref={bandRef} className="cs-footer-signature" aria-hidden>
      <div className="mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        {/* The wordmark SVG is applied as a mask so the letters can carry a
            vertical fade (see `.cs-footer-wordmark`). */}
        <div className="cs-footer-wordmark" />
      </div>
    </div>
  );
}
