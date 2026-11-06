"use client";

import { type RefObject, useEffect, useId, useRef, useState } from "react";

/** True once the element has scrolled into view; stays true after that. */
function useShown<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, shown];
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const LABEL_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 600,
  letterSpacing: "-0.01em",
} as const;

/** The two values of the headline finding as bars drawn to the same scale. */
export function GrowBars({ from, to }: { from: number; to: number }): React.ReactElement {
  const [ref, shown] = useShown<HTMLDivElement>();
  const bars = [
    { value: from, ratio: from / to, fill: "rgba(255, 255, 255, 0.34)", delay: 0 },
    {
      value: to,
      ratio: 1,
      fill: "linear-gradient(180deg, #9A51FF 0%, #2CC1EB 100%)",
      delay: 180,
    },
  ];

  return (
    <div ref={ref} aria-hidden className="relative flex items-end gap-4 [--bar-max:150px] lg:[--bar-max:232px]">
      {bars.map((bar) => (
        <div key={bar.value} className="flex w-[88px] flex-col items-start gap-2 lg:w-[104px]">
          <span
            className="tabular-nums text-white transition-opacity duration-700 motion-reduce:transition-none"
            style={{ ...LABEL_STYLE, opacity: shown ? 1 : 0, transitionDelay: `${bar.delay + 500}ms` }}
          >
            {bar.value}
          </span>
          <div
            className="w-full motion-reduce:transition-none"
            style={{
              height: `calc(var(--bar-max) * ${bar.ratio})`,
              background: bar.fill,
              borderRadius: "14px 14px 6px 6px",
              transformOrigin: "bottom",
              transform: shown ? "scaleY(1)" : "scaleY(0)",
              transition: `transform 1.1s ${EASE} ${bar.delay}ms`,
              boxShadow: bar.value === to ? "0 0 36px -8px rgba(111, 70, 255, 0.7)" : undefined,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** A progress ring for a share of a whole. */
export function ShareRing({ percent }: { percent: number }): React.ReactElement {
  const gradientId = useId();
  const [ref, shown] = useShown<HTMLDivElement>();
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div ref={ref} aria-hidden className="shrink-0">
      <svg viewBox="0 0 100 100" width={104} height={104}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#B17EFF" />
            <stop offset="1" stopColor="#4FD1F5" />
          </linearGradient>
        </defs>
        <circle cx={50} cy={50} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={10} />
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={shown ? circumference * (1 - percent / 100) : circumference}
          transform="rotate(-90 50 50)"
          className="motion-reduce:transition-none"
          style={{ transition: `stroke-dashoffset 1.5s ${EASE}` }}
        />
      </svg>
    </div>
  );
}
