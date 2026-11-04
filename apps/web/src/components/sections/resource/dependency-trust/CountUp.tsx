"use client";

import { useEffect, useRef } from "react";

interface CountUpProps {
  value: number;
  suffix?: string;
  className?: string;
}

const FORMAT = new Intl.NumberFormat("en-US");
const DURATION_MS = 1400;

/**
 * A figure that counts up once, when it first scrolls into view, so the size of
 * the number registers before the caption is read. The final value is in the
 * server HTML, so it is correct without JavaScript and under reduced motion.
 * The counting writes to the DOM directly: no React state changes per frame.
 */
export function CountUp({ value, suffix = "", className }: CountUpProps): React.ReactElement {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number): void => {
          const progress = Math.min(1, (now - start) / DURATION_MS);
          const eased = 1 - (1 - progress) ** 3;
          node.textContent = `${FORMAT.format(Math.round(value * eased))}${suffix}`;
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, suffix]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`.trim()}>
      {FORMAT.format(value)}
      {suffix}
    </span>
  );
}
