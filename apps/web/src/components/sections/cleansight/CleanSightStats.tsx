"use client";

/*
 * Figma node 373:1236 — 1920×550 px
 *
 * Background: linear-gradient(180deg, #151021 0%, #131e8f 67.139%, #471ec0 107.43%)
 * Heading at y=100 (100 px from top)
 * Stats group at y=224, 1276 px wide, centred
 *   — 4 items × 209.328 px wide, gap=18 px between value and label
 *   — 3 vertical divider lines between columns (x=604, 960, 1315 within 1276 content)
 * Decorative Union shape: top-right, mix-blend-overlay, -rotate-150, -scale-y-100
 *
 * Numbers count up from 0 when the section first enters the viewport.
 */

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

interface StatDef {
  prefix: string;
  end: number;
  suffix: string;
  label: string;
  labelSize: string;
  labelTracking: string;
}

const STATS: StatDef[] = [
  { prefix: "",  end: 85,  suffix: "%",   label: "Container coverage",   labelSize: "clamp(13px,1.198vw,23px)", labelTracking: "-1.15px" },
  { prefix: "<", end: 24,  suffix: " hr", label: "Remediation cycles",   labelSize: "clamp(12px,1.042vw,20px)", labelTracking: "-1px"    },
  { prefix: "",  end: 85,  suffix: "%",   label: "Risk reduction",        labelSize: "clamp(12px,1.042vw,20px)", labelTracking: "-1px"    },
  { prefix: "",  end: 100, suffix: "%",   label: "Compliance visibility", labelSize: "clamp(12px,1.042vw,20px)", labelTracking: "-1px"    },
];

/** Counts from 0 → end when `active` flips true. Fires once. Honors
 *  prefers-reduced-motion: when the user has motion reduced, jumps
 *  straight to the final value instead of animating. */
function useCountUp(end: number, active: boolean, duration = 1400): number {
  const [count, setCount] = useState(0);
  const fired = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || fired.current) return;
    fired.current = true;

    if (reduceMotion) {
      setCount(end);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [active, end, duration, reduceMotion]);

  return count;
}

function AnimatedStatValue({
  prefix,
  end,
  suffix,
  active,
  style,
}: {
  prefix: string;
  end: number;
  suffix: string;
  active: boolean;
  style: React.CSSProperties;
}) {
  const count = useCountUp(end, active);
  return (
    <p style={style}>
      {prefix}{count}{suffix}
    </p>
  );
}

export function CleanSightStats(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      data-section="CleanSightStats"
      aria-labelledby="cleansight-stats-heading"
      className="relative overflow-hidden"
      style={{
        minHeight: "550px",
        background: "linear-gradient(180deg, #151021 0%, #131e8f 67.139%, #471ec0 107.43%)",
      }}
    >
      {/* ── Decorative Union — top-right, mix-blend-overlay ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/stats-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          right: "-20px",
          top: "-206px",
          width: "469px",
          height: "488px",
          mixBlendMode: "overlay",
          transform: "rotate(-150deg) scaleY(-1)",
          opacity: 0.9,
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-6 py-section-md" style={{ paddingBottom: "250px" }}>

        {/* ── Heading ── */}
        <div className="text-center" style={{ marginBottom: "62px" }}>
          <h2
            id="cleansight-stats-heading"
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.23vw, 62px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              whiteSpace: "nowrap",
            }}
          >
            From Visibility to{" "}
            <span
              style={{
                background:
                  "linear-gradient(110.35deg, rgb(154, 81, 255) 65.662%, rgb(44, 193, 235) 93.65%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Results
            </span>
          </h2>
        </div>

        {/* ── Stats row — 4 columns with vertical dividers ── */}
        <div className="relative grid grid-cols-2 xl:grid-cols-4">

          {/* Vertical dividers — 3 lines between the 4 columns */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              aria-hidden
              className="absolute hidden xl:block pointer-events-none"
              style={{
                left: `${(i / 4) * 100}%`,
                top: 0,
                bottom: 0,
                width: "1px",
                background: "rgba(255,255,255,0.18)",
              }}
            />
          ))}

          {/* Mobile divider — horizontal line between rows */}
          <div
            aria-hidden
            className="xl:hidden absolute pointer-events-none"
            style={{
              left: 0, right: 0,
              top: "50%",
              height: "1px",
              background: "rgba(255,255,255,0.18)",
            }}
          />
          <div
            aria-hidden
            className="xl:hidden absolute pointer-events-none"
            style={{
              top: 0, bottom: 0,
              left: "50%",
              width: "1px",
              background: "rgba(255,255,255,0.18)",
            }}
          />

          {STATS.map((s) => (
            <div
              key={s.label}
              className="text-center text-white flex flex-col items-center py-6 xl:py-0"
              style={{ gap: "18px" }}
            >
              {/* Animated stat number */}
              <AnimatedStatValue
                prefix={s.prefix}
                end={s.end}
                suffix={s.suffix}
                active={inView}
                style={{
                  fontFamily: "'Rethink Sans', var(--font-display), sans-serif",
                  fontSize: "clamp(32px, 3.23vw, 62px)",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              />
              {/* Label */}
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: s.labelSize,
                  fontWeight: 400,
                  letterSpacing: s.labelTracking,
                  lineHeight: 1.4,
                  opacity: 0.9,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
