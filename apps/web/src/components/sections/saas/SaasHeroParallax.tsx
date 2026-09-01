'use client';

import { type ReactNode, useEffect, useRef } from 'react';

/*
 * Cursor parallax for the SaaS hero artifact.
 *
 * The artifact already has three depth planes — a blurred back row, the
 * application surface, and the front cards. This ties them to the pointer at
 * different rates so that depth is real rather than implied.
 *
 * It publishes the pointer position as two CSS custom properties and stops
 * there. The layers read them in globals.css. Nothing is held in React state on
 * purpose: state would re-render the entire SVG on every mousemove, where custom
 * properties let the compositor do the work.
 *
 * Reads are rAF-throttled, so a burst of pointermove events collapses to one
 * write per frame.
 *
 * Gated three ways, and it attaches no listener at all when any gate fails:
 *   - `(hover: hover) and (pointer: fine)`, so touch devices do not carry a dead
 *     listener for an effect they can never trigger.
 *   - `prefers-reduced-motion`, where the whole thing is off.
 *   - The listener sits on the hero SECTION rather than the window, so it only
 *     runs while the cursor is over the hero at all.
 *
 * Within that, the effect is keyed to the ARTIFACT, not the section: position is
 * normalised against the artifact's own box, and the layers return to rest the
 * moment the cursor leaves it. Tracking the whole section meant the illustration
 * drifted while the cursor was over the headline on the other side of the hero,
 * which reads as the page moving on its own rather than as a response to
 * pointing at the thing.
 *
 * The idle drift in globals.css is unaffected and keeps running underneath, so
 * the artifact still moves when the cursor is elsewhere on the page.
 */
export function SaasHeroParallax({ children }: { children: ReactNode }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || still.matches) return;

    const section = el.closest('section');
    if (!section) return;

    let frame = 0;
    let px = 0;
    let py = 0;

    const write = (): void => {
      frame = 0;
      el.style.setProperty('--cs-px', px.toFixed(3));
      el.style.setProperty('--cs-py', py.toFixed(3));
    };

    const schedule = (): void => {
      if (frame === 0) frame = requestAnimationFrame(write);
    };

    const onMove = (event: PointerEvent): void => {
      // The artifact's own box, not the section's. The artifact is
      // pointer-events-none, so hover cannot be detected by events; it is
      // computed from geometry instead.
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        if (px === 0 && py === 0) return;
        px = 0;
        py = 0;
        schedule();
        return;
      }

      // Normalised to -1..1 from the artifact's centre.
      px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      schedule();
    };

    const onLeave = (): void => {
      px = 0;
      py = 0;
      schedule();
    };

    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="cs-par-root">
      {children}
    </div>
  );
}
