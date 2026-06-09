"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/motion";

const AUTOPLAY_MS = 6500;
const SWIPE_THRESHOLD = 48;

interface CarouselItem {
  id: string;
  title: string;
}

interface UpcomingEventCarouselProps {
  /**
   * Pre-rendered `FeaturedEventCard`s (server components passed as props), one
   * per upcoming event. Kept as nodes so this client component never imports
   * the card — which transitively pulls server-only CMS fetch code.
   */
  slides: React.ReactNode[];
  /** Parallel metadata for keys, dot labels, and the live-region announcement. */
  items: CarouselItem[];
}

/**
 * Hero carousel for multiple upcoming events. Shows one slide at a time with
 * prev/next controls, dot indicators, touch swipe, and gentle autoplay (paused
 * on hover/focus, disabled under reduced motion). The caller only renders this
 * when there is more than one upcoming event.
 */
export function UpcomingEventCarousel({
  slides,
  items,
}: UpcomingEventCarouselProps): React.ReactElement {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  // +1 = advancing forward (slide in from the right), -1 = going back.
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const go = useCallback(
    (next: number, dir: number) => {
      setDirection(dir);
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const prev = useCallback(() => go(index - 1, -1), [go, index]);
  const next = useCallback(() => go(index + 1, 1), [go, index]);

  // Autoplay — only when not paused, motion is allowed, and there's >1 slide.
  useEffect(() => {
    if (paused || reduceMotion || count <= 1) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, count]);

  const pointerStartX = useRef<number | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  }, []);
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = pointerStartX.current;
      pointerStartX.current = null;
      if (start == null) return;
      const delta = e.clientX - start;
      if (delta <= -SWIPE_THRESHOLD) next();
      else if (delta >= SWIPE_THRESHOLD) prev();
    },
    [next, prev],
  );

  const activeTitle = items[index]?.title ?? "";

  return (
    <LazyMotion features={domAnimation} strict>
      {/* biome-ignore lint/a11y/useSemanticElements: a carousel region is the documented ARIA pattern for this control. */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Upcoming events"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="relative outline-none"
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="relative"
          style={{ minHeight: "clamp(300px, 30vw, 368px)" }}
        >
          <m.div
            key={index}
            initial={reduceMotion ? false : { opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            {slides[index]}
          </m.div>
        </div>

        <p className="sr-only" aria-live="polite">
          {`Event ${index + 1} of ${count}: ${activeTitle}`}
        </p>

        <div
          className="flex items-center justify-center"
          style={{ gap: "16px", marginTop: "28px" }}
        >
          <CarouselArrow direction="prev" onClick={prev} />

          <div className="flex items-center" style={{ gap: "10px" }}>
            {items.map((item, i) => {
              const isActive = i === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(i, i > index ? 1 : -1)}
                  aria-label={`Go to event ${i + 1}: ${item.title}`}
                  aria-current={isActive ? "true" : undefined}
                  className="rounded-full transition-all"
                  style={{
                    width: isActive ? "28px" : "10px",
                    height: "10px",
                    background: isActive
                      ? "linear-gradient(93.21deg, #9A51FF 18.08%, #2CC1EB 286.32%)"
                      : "rgba(255,255,255,0.35)",
                  }}
                />
              );
            })}
          </div>

          <CarouselArrow direction="next" onClick={next} />
        </div>
      </div>
    </LazyMotion>
  );
}

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}): React.ReactElement {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Previous event" : "Next event"}
      className="flex items-center justify-center rounded-full text-white transition-colors"
      style={{
        width: "44px",
        height: "44px",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.25)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
        style={{ transform: isPrev ? "rotate(180deg)" : undefined }}
      >
        <path
          d="M3.5 8h9M8.5 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
