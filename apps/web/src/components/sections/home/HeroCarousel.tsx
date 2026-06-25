"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * Auto-advancing hero carousel (crossfade rotator).
 *
 * Slides live in a single CSS grid cell (grid-area: 1/1) so the container
 * auto-sizes to the tallest slide — no JS measurement, no layout shift between
 * slides. The active slide crossfades + rises in; inactive slides are
 * transparent, non-interactive (`inert`), and hidden from the a11y tree.
 *
 * Motion discipline (mirrors Testimonials.tsx):
 * • Auto-advance pauses on hover, focus-within, tab-hidden, and an explicit
 *   pause toggle.
 * • `prefers-reduced-motion` disables auto-advance entirely and makes slide
 *   swaps instant (no opacity/transform transition).
 *
 * a11y: WAI-ARIA carousel pattern — region + roledescription, slide groups,
 * dot buttons with aria-current, a polite live region announcing the active
 * slide, and a pause/play control (WCAG 2.2.2: auto-rotating content needs a
 * pause mechanism).
 */
export interface HeroSlide {
  id: string;
  /** Human-readable slide name, announced to screen readers + dot labels. */
  label: string;
  content: React.ReactNode;
}

const AUTO_ADVANCE_MS = 6500;
const TRANSITION_MS = 700;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }): React.ReactElement {
  const total = slides.length;
  const [active, setActive] = useState(0);
  // `autoPaused` = transient (hover / focus / tab-hidden). `userPaused` =
  // explicit toggle. `reduced` = prefers-reduced-motion. Any of them stops
  // auto-advance.
  const [autoPaused, setAutoPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const baseId = useId();

  const goTo = useCallback(
    (i: number) => setActive(((i % total) + total) % total),
    [total],
  );
  const goNext = useCallback(() => setActive((i) => (i + 1) % total), [total]);
  const goPrev = useCallback(
    () => setActive((i) => (i - 1 + total) % total),
    [total],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (): void => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (autoPaused || userPaused || reduced || total <= 1) return;
    const id = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [autoPaused, userPaused, reduced, total, goNext]);

  useEffect(() => {
    const handler = (): void => setAutoPaused(document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (total <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  // Pause while a finger is down; a horizontal swipe > 40 px navigates on release.
  const onTouchStart = (e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    setAutoPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent): void => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    setAutoPaused(false);
    const touch = e.changedTouches[0];
    if (startX == null || !touch) return;
    const dx = touch.clientX - startX;
    if (Math.abs(dx) > 40) (dx > 0 ? goPrev : goNext)();
  };
  const onTouchCancel = (): void => {
    touchStartX.current = null;
    setAutoPaused(false);
  };

  // focus-within pause: ignore blur events whose focus stays inside the region.
  const onBlur = (e: React.FocusEvent): void => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setAutoPaused(false);
    }
  };

  if (total === 0) return <></>;

  const playing = !(autoPaused || userPaused || reduced);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      className="relative"
      onMouseEnter={() => setAutoPaused(true)}
      onMouseLeave={() => setAutoPaused(false)}
      onFocus={() => setAutoPaused(true)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <div className="grid">
        {slides.map((slide, i) => {
          const isActive = i === active;
          return (
            <div
              key={slide.id}
              id={`${baseId}-slide-${i}`}
              // biome-ignore lint/a11y/useSemanticElements: the WAI-ARIA carousel pattern requires role="group" + aria-roledescription="slide" on each slide; no native HTML element conveys this.
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}: ${slide.label}`}
              aria-hidden={!isActive}
              inert={!isActive}
              className="[grid-area:1/1]"
              style={{
                opacity: isActive ? 1 : 0,
                transform: reduced || isActive ? "none" : "translateY(10px)",
                transition: reduced
                  ? "none"
                  : `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              {slide.content}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <div className="mt-9 flex items-center justify-center gap-4 lg:mt-12">
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-pressed={userPaused}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <rect x="1.5" width="3" height="12" rx="1" />
                <rect x="7.5" width="3" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M2 1.3v9.4a.7.7 0 0 0 1.07.6l7.4-4.7a.7.7 0 0 0 0-1.2L3.07.7A.7.7 0 0 0 2 1.3Z" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2">
            {slides.map((slide, i) => {
              const isActive = i === active;
              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  aria-controls={`${baseId}-slide-${i}`}
                  aria-label={`Go to slide ${i + 1}: ${slide.label}`}
                  onClick={() => goTo(i)}
                  className="group grid h-3 place-items-center focus-visible:outline-none"
                >
                  <span
                    className="block h-1.5 rounded-full transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-white/70 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-transparent"
                    style={{
                      width: isActive ? 32 : 14,
                      background: isActive
                        ? "linear-gradient(90deg, rgba(133,107,255,1) 0%, rgba(103,142,255,1) 100%)"
                        : "rgba(255,255,255,0.28)",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {`Slide ${active + 1} of ${total}: ${slides[active]?.label ?? ""}`}
      </div>
    </section>
  );
}
