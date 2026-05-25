"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Figma node 787:2316 — Operational Impact section.
 * Frame: 1440 × 627 px.
 *
 * Layout (centred, total content width = 1275px):
 *   Left column:  cube image  369 × 446 px
 *   Gap:          67 px
 *   Right column: 839 px
 *     • H2   62px Figtree Bold  ls=-3.1px(−0.05em)  w=654px
 *     • gap  80px
 *     • Stats 4 × 176px columns, 45px gaps (absolute offsets 0/221/442/663)
 *       – number  52px Figtree Bold  ls=-2.6px(−0.05em)
 *       – label   20px Figtree Reg   ls=-1px(−0.05em)  lh=1.4  #333
 *
 * vw rates (value / 1440 × 100):
 *   paddingTop   120 / 1440 = 8.33vw
 *   h2 font       62 / 1440 = 4.31vw
 *   stat num      52 / 1440 = 3.61vw
 *   stat label    20 / 1440 = 1.39vw
 *   h2 gap        80 / 1440 = 5.56vw
 *   cube width   369 / 1440 = 25.63vw
 */

interface Stat {
  target: number;
  label: string;
}

const STATS: Stat[] = [
  { target: 80, label: "Faster audit preparation" },
  { target: 35, label: "Lower remediation overhead" },
  { target: 40, label: "Reduced compliance complexity" },
  { target: 60, label: "Less manual compliance effort" },
];

const DURATION = 2000;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function FipsOperationalImpact(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);
  const [counts, setCounts] = useState<number[]>(() => STATS.map(() => 0));

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
      {/*
       * Subtle grid texture (matches Figma background grid lines)
       */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(35,90,220,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(35,90,220,0.045) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/*
       * Left decorative vector — Figma: x=−41 y=63 w=577 h=560
       * Positioned relative to the section left edge.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/flare-left.png"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "-41px",
          top: "63px",
          width: "577px",
          height: "560px",
          opacity: 0.5,
          mixBlendMode: "multiply",
        }}
        loading="lazy"
        decoding="async"
      />

      {/*
       * Top-right soft halo — Figma: x=1663 y=−40 w=371 h=371
       */}
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

      <div
        className="relative mx-auto px-4 md:px-0"
        style={{
          maxWidth: "1276px",
          /*
           * Figma: content top y=120px at 1440px → 120/1440 = 8.33vw
           */
          paddingTop: "clamp(60px, 8.33vw, 120px)",
          /*
           * Footer contract: the last bg-providing element on a CTA page uses
           * --spacing-section-cta (160 → 250px) so the centered CTA card has
           * matching breathing room above and below the footer's top edge.
           */
          paddingBottom: "var(--spacing-section-cta)",
        }}
      >
        <div
          className="flex flex-col md:flex-row items-center md:items-start"
          style={{ gap: "clamp(32px, 4.65vw, 67px)" }}
        >
          {/* ── Left column: 3D cube image ── */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/fips/cube-impact.png"
              alt=""
              aria-hidden
              className="pointer-events-none select-none"
              style={{
                /*
                 * Figma: 369px wide at 1440px → 369/1440 = 25.63vw
                 */
                width: "clamp(200px, 25.63vw, 369px)",
                height: "auto",
              }}
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* ── Right column: heading + stats ── */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-[#111] text-center md:text-left"
              style={{
                fontFamily: "var(--font-display)",
                /*
                 * Figma: 62px at 1440px → 62/1440 = 4.31vw
                 */
                fontSize: "clamp(28px, 4.31vw, 62px)",
                fontWeight: 700,
                /* Figma: −3.1px on 62px = −0.05em */
                letterSpacing: "-0.05em",
                lineHeight: 1.05,
                maxWidth: "654px",
                /*
                 * Figma: 80px gap between heading and stats at 1440px → 5.56vw
                 */
                marginBottom: "clamp(32px, 5.56vw, 80px)",
              }}
            >
              Operational Impact of Built-In{" "}
              <span className="cs-text-gradient-impact">Compliance</span>
            </h2>

            {/* Stats row — 4 columns, each 176px, 45px gap */}
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{ gap: "clamp(16px, 3.13vw, 45px) clamp(16px, 3.13vw, 45px)" }}
            >
              {STATS.map((stat, idx) => (
                <div
                  key={stat.label}
                  className="relative"
                  style={
                    idx > 0
                      ? {
                          paddingLeft: "clamp(12px, 1.67vw, 24px)",
                          borderLeft: "1.5px solid rgba(35, 90, 220, 0.18)",
                        }
                      : undefined
                  }
                >
                  {/* Number */}
                  <p
                    aria-live="polite"
                    aria-label={`${stat.target}% ${stat.label}`}
                    className="text-[#111]"
                    style={{
                      fontFamily: "var(--font-display)",
                      /*
                       * Mobile: 32px (Figma 366:7788), desktop: 52px at 1440px → 3.61vw
                       */
                      fontSize: "clamp(32px, 3.61vw, 52px)",
                      fontWeight: 700,
                      /* Figma: −2.6px on 52px = −0.05em */
                      letterSpacing: "-0.05em",
                      lineHeight: 1,
                      marginBottom: "8px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {counts[idx] ?? 0}%
                  </p>

                  {/* Label */}
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      /*
                       * Mobile: 16px (Figma 366:7788), desktop: 20px at 1440px → 1.39vw
                       */
                      fontSize: "clamp(16px, 1.39vw, 20px)",
                      fontWeight: 400,
                      /* Figma: −1px on 20px = −0.05em */
                      letterSpacing: "-0.05em",
                      lineHeight: 1.4,
                      color: "#333",
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
