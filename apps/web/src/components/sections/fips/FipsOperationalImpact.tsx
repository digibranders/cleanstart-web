"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  /** Final integer value (without the %) */
  target: number;
  label: string;
}

const STATS: Stat[] = [
  { target: 80, label: "Faster audit preparation" },
  { target: 35, label: "Lower remediation overhead" },
  { target: 40, label: "Reduced compliance complexity" },
  { target: 60, label: "Less manual compliance effort" },
];

const DURATION = 2000; // ms — total animation time

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function FipsOperationalImpact(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);
  const [counts, setCounts] = useState<number[]>(() => STATS.map(() => 0));

  /* Start counters once when the section first enters the viewport. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  /* Animate from 0 → target on each frame using easeOutCubic. */
  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / DURATION, 1);
      const eased = easeOutCubic(progress);
      setCounts(STATS.map((s) => Math.round(eased * s.target)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  return (
    <section
      ref={sectionRef}
      data-section="FipsOperationalImpact"
      className="relative bg-white overflow-hidden"
    >
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(35,90,220,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(35,90,220,0.045) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Top-right soft halo */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "-3%",
          top: "-40px",
          width: "371px",
          height: "371px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(178, 205, 255, 0.55) 0%, rgba(178, 205, 255, 0) 75%)",
          filter: "blur(24px)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-14 md:pt-[100px] pb-14 md:pb-[100px] lg:pb-[250px]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10 md:gap-12 items-center">
          {/* Cube */}
          <div className="flex justify-center md:justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/fips/cube-impact.png"
              alt=""
              aria-hidden
              className="pointer-events-none select-none"
              style={{
                width: "clamp(220px, 22vw, 369px)",
                height: "auto",
              }}
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Heading + stats */}
          <div>
            <h2
              className="text-[#111] mb-10 md:mb-[40px]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 4vw, 56px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                maxWidth: "654px",
              }}
            >
              Operational Impact of Built-In{" "}
              <span className="cs-text-gradient-impact">Compliance</span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
              {STATS.map((stat, idx) => (
                <div
                  key={stat.label}
                  className="relative"
                  style={
                    idx > 0
                      ? {
                          paddingLeft: "clamp(12px, 1.5vw, 24px)",
                          borderLeft: "1px solid rgba(35, 90, 220, 0.18)",
                        }
                      : undefined
                  }
                >
                  <p
                    aria-live="polite"
                    aria-label={`${stat.target}% ${stat.label}`}
                    className="text-[#111]"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-t-display-2)",
                      fontWeight: 700,
                      letterSpacing: "var(--text-t-display-2-ls)",
                      lineHeight: "var(--text-t-display-2-lh)",
                      marginBottom: "10px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {counts[idx] ?? 0}%
                  </p>
                  <p
                    className="text-[#333]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "clamp(20px, 2vw, 28px)",
                      fontWeight: 500,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                      opacity: 0.85,
                      maxWidth: "176px",
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
