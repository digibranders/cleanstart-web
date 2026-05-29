'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';

/**
 * Scroll-triggered count-up that runs once when the element enters the viewport.
 * Honours prefers-reduced-motion by jumping straight to the final value. Kept as
 * a client island so the parent can remain a server component.
 */
interface MetricCounterProps {
  /** Final integer value (e.g. 89). */
  to: number;
  /** Suffix appended after the number (e.g. "%", "×", "x"). */
  suffix?: string;
  /** Duration of the count-up in milliseconds. */
  durationMs?: number;
}

export function MetricCounter({
  to,
  suffix = '',
  durationMs = 1200,
}: MetricCounterProps): React.ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setValue(to);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number): void => {
              const elapsed = now - start;
              const progress = Math.min(1, elapsed / durationMs);
              const eased = 1 - (1 - progress) ** 3;
              setValue(Math.round(eased * to));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [to, durationMs]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}
