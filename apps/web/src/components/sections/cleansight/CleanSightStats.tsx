"use client";

/*
 * Stats band — four count-up metrics in a row with vertical dividers and a
 * decorative overlay shape. Numbers count up from 0 when the section first
 * enters the viewport.
 */

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/ui/Reveal";

interface StatDef {
  prefix: string;
  end: number;
  suffix: string;
  label: string;
  labelSize: string;
  labelTracking: string;
}

const STATS: StatDef[] = [
  { prefix: "", end: 85, suffix: "%", label: "Container coverage", labelSize: "clamp(15px,1.198vw,23px)", labelTracking: "-0.02em" },
  { prefix: "<", end: 24, suffix: " hr", label: "Remediation cycles", labelSize: "clamp(15px,1.042vw,20px)", labelTracking: "-0.02em" },
  { prefix: "", end: 85, suffix: "%", label: "Risk reduction", labelSize: "clamp(15px,1.042vw,20px)", labelTracking: "-0.02em" },
  { prefix: "", end: 100, suffix: "%", label: "Compliance visibility", labelSize: "clamp(14px,1.042vw,20px)", labelTracking: "-0.02em" },
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
      {/* Decorative overlay shape — top-right. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/stats-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-md" style={{ paddingBottom: "var(--spacing-section-cta)" }}>

        {/* Heading. */}
        <div className="text-center" style={{ marginBottom: "62px" }}>
          <Reveal header>
            <h2
              id="cleansight-stats-heading"
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              From Visibility{" "}
              <span style={{ whiteSpace: "nowrap" }}>
                to <span className="cs-text-gradient-impact">Remediation</span>
              </span>
            </h2>
          </Reveal>
        </div>

        {/* Stats row — 4 columns with vertical dividers. */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4">

          {/* Vertical dividers — 3 lines between the 4 columns */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              aria-hidden
              className="absolute hidden lg:block pointer-events-none"
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
            className="lg:hidden absolute pointer-events-none"
            style={{
              left: 0, right: 0,
              top: "50%",
              height: "1px",
              background: "rgba(255,255,255,0.18)",
            }}
          />
          <div
            aria-hidden
            className="lg:hidden absolute pointer-events-none"
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
              className="text-center text-white flex flex-col items-center py-6 lg:py-0"
              style={{ gap: "18px" }}
            >
              {/* Animated stat number. */}
              <AnimatedStatValue
                prefix={s.prefix}
                end={s.end}
                suffix={s.suffix}
                active={inView}
                style={{
                  fontFamily: "'Rethink Sans', var(--font-display), sans-serif",
                  fontSize: "var(--fs-display)",
                  fontWeight: 700,
                  lineHeight: "var(--fs-display-lh)",
                  letterSpacing: "var(--fs-display-ls)",
                }}
              />
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-h3)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
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
