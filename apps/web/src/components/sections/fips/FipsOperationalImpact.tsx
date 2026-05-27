"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Figma node 787:2316 — Operational Impact section.
 * Frame: 1440 × 627 px.
 *
 * Layout (centred, total content width = 1275px):
 *   Left column:  cube image  369 × 446 px
 *   Gap:          67 px
 *   Right column: 839 px
 *     • H2   62px Manrope Bold  ls=-3.1px(−0.05em)  w=654px
 *     • gap  80px
 *     • Stats 4 × 176px columns, 45px gaps (absolute offsets 0/221/442/663)
 *       – number  52px Manrope Bold  ls=-2.6px(−0.05em)
 *       – label   20px Manrope Reg   ls=-1px(−0.05em)  lh=1.4  #333
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
        {/* Mobile-only heading — sits above the cube. */}
        <h2
          className="md:hidden text-[#111] text-center mx-auto"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h1)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
            marginBottom: "clamp(24px, 6vw, 40px)",
          }}
        >
          Operational Impact of Built-In{" "}
          <span className="cs-text-gradient-impact">Compliance</span>
        </h2>

        <div
          className="flex flex-col md:flex-row items-center md:items-start"
          style={{ gap: "clamp(24px, 4.65vw, 67px)" }}
        >
          {/* ── Cube image — left on desktop, between heading and stats on mobile ── */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div
              className="relative flex items-center justify-center"
              style={{ width: "clamp(220px, 28vw, 401px)" }}
            >
              {/* Radial purple grid backdrop — sits behind the cube only. */}
              <CubeGridBackdrop />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/fips/cube-impact-transparent.png"
                alt=""
                aria-hidden
                className="pointer-events-none select-none relative"
                style={{
                  width: "clamp(200px, 25.63vw, 369px)",
                  height: "auto",
                }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* ── Right column on desktop: heading + stats; mobile: stats only, centered ── */}
          <div className="flex-1 min-w-0 w-full">
            <h2
              className="hidden md:block text-[#111] md:text-left"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h1)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.05,
                maxWidth: "654px",
                marginBottom: "clamp(32px, 5.56vw, 80px)",
              }}
            >
              Operational Impact of Built-In{" "}
              <span className="cs-text-gradient-impact">Compliance</span>
            </h2>

            {/*
             * Stats — 1-col centered stack on mobile, 4-col flex row on
             * desktop. Same dashed cyan gradient dividers between items
             * (horizontal on mobile, vertical on desktop).
             */}
            <div
              className="flex flex-col items-stretch md:flex-row md:items-stretch md:justify-between"
              style={{ gap: "clamp(20px, 3.13vw, 45px)" }}
            >
              {STATS.map((stat, idx) => (
                <React.Fragment key={stat.label}>
                  <div className="relative text-center md:text-left md:flex-1 md:min-w-0">
                    {/* Number */}
                    <p
                      aria-live="polite"
                      aria-label={`${stat.target}% ${stat.label}`}
                      className="text-[#111]"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--fs-display)",
                        fontWeight: 700,
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
                      className="mx-auto md:mx-0"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--fs-body)",
                        fontWeight: 400,
                        letterSpacing: "-0.05em",
                        lineHeight: 1.4,
                        color: "#333",
                        maxWidth: "220px",
                      }}
                    >
                      {stat.label}
                    </p>
                  </div>

                  {idx < STATS.length - 1 && (
                    <>
                      <MobileDashedDivider />
                      <DesktopDashedDivider />
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Mobile divider — dashed cyan gradient line between stacked stat rows.
 * Hidden at md+ where stats sit side-by-side with the desktop border divider.
 */
function MobileDashedDivider() {
  return (
    <svg
      aria-hidden
      className="md:hidden self-center pointer-events-none select-none"
      width="246"
      height="2"
      viewBox="0 0 246 2"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 1L246 1"
        stroke="url(#fipsImpactDividerGradient)"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeDasharray="8 8"
      />
      <defs>
        <linearGradient
          id="fipsImpactDividerGradient"
          x1="0"
          y1="1"
          x2="246"
          y2="1"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2CC1EB" stopOpacity="0" />
          <stop offset="0.511" stopColor="#2CC1EB" />
          <stop offset="1" stopColor="#2CC1EB" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Desktop divider — same dashed cyan gradient as the mobile divider but
 * rotated 90° so it stretches vertically between the 4 stat columns.
 * Hidden below md where the mobile (horizontal) divider takes over.
 */
function DesktopDashedDivider() {
  return (
    <svg
      aria-hidden
      className="hidden md:block self-stretch shrink-0 pointer-events-none select-none"
      width="2"
      height="116"
      viewBox="0 0 2 116"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.75 0L0.75 116"
        stroke="url(#fipsImpactDividerVGradient)"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeDasharray="8 8"
      />
      <defs>
        <linearGradient
          id="fipsImpactDividerVGradient"
          x1="0.75"
          y1="0"
          x2="0.75"
          y2="116"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2CC1EB" stopOpacity="0" />
          <stop offset="0.511" stopColor="#2CC1EB" />
          <stop offset="1" stopColor="#2CC1EB" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Radial purple pixel-grid backdrop behind the cube image (Figma 366:8051).
 * Sits absolutely centred behind the cube and is masked by a radial purple
 * gradient so the grid fades to nothing at the edges.
 */
function CubeGridBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none select-none absolute"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        height: "auto",
        opacity: 0.55,
      }}
      width="302"
      height="292"
      viewBox="0 0 302 292"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.25"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.5531 237.503V255.247H0V255.753H18.5531V273.497H0V274.003H18.5531V292H19.0757V274.003H37.3675V292H37.8902V274.003H56.182V292H56.7046V274.003H74.9964V292H75.519V274.003H93.8108V292H94.3335V274.003H112.625V292H113.148V274.003H131.44V292H131.962V274.003H150.254V292H150.777V274.003H169.069V292H169.591V274.003H187.883V292H188.406V274.003H206.697V292H207.22V274.003H225.512V292H226.034V274.003H244.326V292H244.849V274.003H263.141V292H263.663V274.003H281.955V292H282.478V274.003H301.031V273.497H282.478V255.753H301.031V255.247H282.478V237.503H301.031V236.997H282.478V219.253H301.031V218.747H282.478V201.003H301.031V200.497H282.478V182.753H301.031V182.247H282.478V164.503H301.031V163.997H282.478V146.253H301.031V145.747H282.478V128.003H301.031V127.497H282.478V109.753H301.031V109.247H282.478V91.5035H301.031V90.9965H282.478V73.2535H301.031V72.7465H282.478V55.0035H301.031V54.4965H282.478V36.7535H301.031V36.2465H282.478V18.5035H301.031V17.9965H282.478V0H281.955V17.9965H263.663V0H263.141V17.9965H244.849V0H244.326V17.9965H226.034V0H225.512V17.9965H207.22V0H206.697V17.9965H188.406V0H187.883V17.9965H169.591V0H169.069V17.9965H150.777V0H150.254V17.9965H131.962V0H131.44V17.9965H113.148V0H112.625V17.9965H94.3335V0H93.8108V17.9965H75.519V0H74.9964V17.9965H56.7046V0H56.182V17.9965H37.8902V0H37.3675V17.9965H19.0757V0H18.5531V17.9965H0V18.5035H18.5531V36.2465H0V36.7535H18.5531V54.4965H0V55.0035H18.5531V72.7465H0V73.2535H18.5531V90.9965H0V91.5035H18.5531V109.247H0V109.753H18.5531V127.497H0V128.003H18.5531V145.747H0V146.253H18.5531V163.997H0V164.503H18.5531V182.247H0V182.753H18.5531V200.497H0V201.003H18.5531V218.747H0V219.253H18.5531V236.997H0V237.503H18.5531ZM281.955 273.497V255.753H263.663V273.497H281.955ZM263.141 273.497V255.753H244.849V273.497H263.141ZM244.326 273.497V255.753H226.034V273.497H244.326ZM225.512 273.497V255.753H207.22V273.497H225.512ZM206.697 273.497V255.753H188.406V273.497H206.697ZM187.883 273.497V255.753H169.591V273.497H187.883ZM169.069 273.497V255.753H150.777V273.497H169.069ZM150.254 273.497V255.753H131.962V273.497H150.254ZM131.44 273.497V255.753H113.148V273.497H131.44ZM112.625 273.497V255.753H94.3335V273.497H112.625ZM93.8108 273.497V255.753H75.519V273.497H93.8108ZM74.9964 273.497V255.753H56.7046V273.497H74.9964ZM56.182 273.497V255.753H37.8902V273.497H56.182ZM37.3675 273.497V255.753H19.0757V273.497H37.3675ZM37.3675 255.247H19.0757V237.503H37.3675V255.247ZM56.182 255.247H37.8902V237.503H56.182V255.247ZM74.9964 255.247H56.7046V237.503H74.9964V255.247ZM93.8108 255.247H75.519V237.503H93.8108V255.247ZM112.625 255.247H94.3335V237.503H112.625V255.247ZM131.44 255.247H113.148V237.503H131.44V255.247ZM150.254 255.247H131.962V237.503H150.254V255.247ZM169.069 255.247H150.777V237.503H169.069V255.247ZM187.883 255.247H169.591V237.503H187.883V255.247ZM206.697 255.247H188.406V237.503H206.697V255.247ZM225.512 255.247H207.22V237.503H225.512V255.247ZM244.326 255.247H226.034V237.503H244.326V255.247ZM263.141 255.247H244.849V237.503H263.141V255.247ZM281.955 255.247H263.663V237.503H281.955V255.247ZM281.955 18.5035H263.663V36.2465H281.955V18.5035ZM281.955 36.7535H263.663V54.4965H281.955V36.7535ZM281.955 55.0035H263.663V72.7465H281.955V55.0035ZM281.955 73.2535H263.663V90.9965H281.955V73.2535ZM281.955 91.5035H263.663V109.247H281.955V91.5035ZM281.955 109.753H263.663V127.497H281.955V109.753ZM281.955 128.003H263.663V145.747H281.955V128.003ZM281.955 146.253H263.663V163.997H281.955V146.253ZM281.955 164.503H263.663V182.247H281.955V164.503ZM281.955 182.753H263.663V200.497H281.955V182.753ZM281.955 201.003H263.663V218.747H281.955V201.003ZM281.955 219.253H263.663V236.997H281.955V219.253ZM263.141 219.253V236.997H244.849V219.253H263.141ZM263.141 201.003V218.747H244.849V201.003H263.141ZM263.141 182.753V200.497H244.849V182.753H263.141ZM263.141 164.503V182.247H244.849V164.503H263.141ZM263.141 146.253V163.997H244.849V146.253H263.141ZM263.141 128.003V145.747H244.849V128.003H263.141ZM263.141 109.753V127.497H244.849V109.753H263.141ZM263.141 91.5035V109.247H244.849V91.5035H263.141ZM263.141 73.2535V90.9965H244.849V73.2535H263.141ZM263.141 55.0035V72.7465H244.849V55.0035H263.141ZM263.141 36.7535V54.4965H244.849V36.7535H263.141ZM263.141 18.5035V36.2465H244.849V18.5035H263.141ZM19.0757 236.997H37.3675V219.253H19.0757V236.997ZM37.8902 236.997H56.182V219.253H37.8902V236.997ZM56.7046 236.997H74.9964V219.253H56.7046V236.997ZM75.519 236.997H93.8108V219.253H75.519V236.997ZM94.3335 236.997H112.625V219.253H94.3335V236.997ZM113.148 236.997H131.44V219.253H113.148V236.997ZM131.962 236.997H150.254V219.253H131.962V236.997ZM150.777 236.997H169.069V219.253H150.777V236.997ZM169.591 236.997H187.883V219.253H169.591V236.997ZM188.406 236.997H206.697V219.253H188.406V236.997ZM207.22 236.997H225.512V219.253H207.22V236.997ZM226.034 236.997H244.326V219.253H226.034V236.997ZM244.326 201.003V218.747H226.034V201.003H244.326ZM244.326 182.753V200.497H226.034V182.753H244.326ZM244.326 164.503V182.247H226.034V164.503H244.326ZM244.326 146.253V163.997H226.034V146.253H244.326ZM244.326 128.003V145.747H226.034V128.003H244.326ZM244.326 109.753V127.497H226.034V109.753H244.326ZM244.326 91.5035V109.247H226.034V91.5035H244.326ZM244.326 73.2535V90.9965H226.034V73.2535H244.326ZM244.326 55.0035V72.7465H226.034V55.0035H244.326ZM244.326 36.7535V54.4965H226.034V36.7535H244.326ZM244.326 18.5035V36.2465H226.034V18.5035H244.326ZM19.0757 218.747H37.3675V201.003H19.0757V218.747ZM37.8902 218.747H56.182V201.003H37.8902V218.747ZM56.7046 218.747H74.9964V201.003H56.7046V218.747ZM75.519 218.747H93.8108V201.003H75.519V218.747ZM94.3335 218.747H112.625V201.003H94.3335V218.747ZM113.148 218.747H131.44V201.003H113.148V218.747ZM131.962 218.747H150.254V201.003H131.962V218.747ZM150.777 218.747H169.069V201.003H150.777V218.747ZM169.591 218.747H187.883V201.003H169.591V218.747ZM188.406 218.747H206.697V201.003H188.406V218.747ZM207.22 218.747H225.512V201.003H207.22V218.747ZM225.512 182.753V200.497H207.22V182.753H225.512ZM225.512 164.503V182.247H207.22V164.503H225.512ZM225.512 146.253V163.997H207.22V146.253H225.512ZM225.512 128.003V145.747H207.22V128.003H225.512ZM225.512 109.753V127.497H207.22V109.753H225.512ZM225.512 91.5035V109.247H207.22V91.5035H225.512ZM225.512 73.2535V90.9965H207.22V73.2535H225.512ZM225.512 55.0035V72.7465H207.22V55.0035H225.512ZM225.512 36.7535V54.4965H207.22V36.7535H225.512ZM225.512 18.5035V36.2465H207.22V18.5035H225.512ZM19.0757 200.497H37.3675V182.753H19.0757V200.497ZM37.8902 200.497H56.182V182.753H37.8902V200.497ZM56.7046 200.497H74.9964V182.753H56.7046V200.497ZM75.519 200.497H93.8108V182.753H75.519V200.497ZM94.3335 200.497H112.625V182.753H94.3335V200.497ZM113.148 200.497H131.44V182.753H113.148V200.497ZM131.962 200.497H150.254V182.753H131.962V200.497ZM150.777 200.497H169.069V182.753H150.777V200.497ZM169.591 200.497H187.883V182.753H169.591V200.497ZM188.406 200.497H206.697V182.753H188.406V200.497ZM206.697 164.503V182.247H188.406V164.503H206.697ZM206.697 146.253V163.997H188.406V146.253H206.697ZM206.697 128.003V145.747H188.406V128.003H206.697ZM206.697 109.753V127.497H188.406V109.753H206.697ZM206.697 91.5035V109.247H188.406V91.5035H206.697ZM206.697 73.2535V90.9965H188.406V73.2535H206.697ZM206.697 55.0035V72.7465H188.406V55.0035H206.697ZM206.697 36.7535V54.4965H188.406V36.7535H206.697ZM206.697 18.5035V36.2465H188.406V18.5035H206.697ZM19.0757 182.247H37.3675V164.503H19.0757V182.247ZM37.8902 182.247H56.182V164.503H37.8902V182.247ZM56.7046 182.247H74.9964V164.503H56.7046V182.247ZM75.519 182.247H93.8108V164.503H75.519V182.247ZM94.3335 182.247H112.625V164.503H94.3335V182.247ZM113.148 182.247H131.44V164.503H113.148V182.247ZM131.962 182.247H150.254V164.503H131.962V182.247ZM150.777 182.247H169.069V164.503H150.777V182.247ZM169.591 182.247H187.883V164.503H169.591V182.247ZM187.883 146.253V163.997H169.591V146.253H187.883ZM187.883 128.003V145.747H169.591V128.003H187.883ZM187.883 109.753V127.497H169.591V109.753H187.883ZM187.883 91.5035V109.247H169.591V91.5035H187.883ZM187.883 73.2535V90.9965H169.591V73.2535H187.883ZM187.883 55.0035V72.7465H169.591V55.0035H187.883ZM187.883 36.7535V54.4965H169.591V36.7535H187.883ZM187.883 18.5035V36.2465H169.591V18.5035H187.883ZM19.0757 163.997H37.3675V146.253H19.0757V163.997ZM37.8902 163.997H56.182V146.253H37.8902V163.997ZM56.7046 163.997H74.9964V146.253H56.7046V163.997ZM75.519 163.997H93.8108V146.253H75.519V163.997ZM94.3335 163.997H112.625V146.253H94.3335V163.997ZM113.148 163.997H131.44V146.253H113.148V163.997ZM131.962 163.997H150.254V146.253H131.962V163.997ZM150.777 163.997H169.069V146.253H150.777V163.997ZM169.069 128.003V145.747H150.777V128.003H169.069ZM169.069 109.753V127.497H150.777V109.753H169.069ZM169.069 91.5035V109.247H150.777V91.5035H169.069ZM169.069 73.2535V90.9965H150.777V73.2535H169.069ZM169.069 55.0035V72.7465H150.777V55.0035H169.069ZM169.069 36.7535V54.4965H150.777V36.7535H169.069ZM169.069 18.5035V36.2465H150.777V18.5035H169.069ZM19.0757 145.747H37.3675V128.003H19.0757V145.747ZM37.8902 145.747H56.182V128.003H37.8902V145.747ZM56.7046 145.747H74.9964V128.003H56.7046V145.747ZM75.519 145.747H93.8108V128.003H75.519V145.747ZM94.3335 145.747H112.625V128.003H94.3335V145.747ZM113.148 145.747H131.44V128.003H113.148V145.747ZM131.962 145.747H150.254V128.003H131.962V145.747ZM150.254 109.753V127.497H131.962V109.753H150.254ZM150.254 91.5035V109.247H131.962V91.5035H150.254ZM150.254 73.2535V90.9965H131.962V73.2535H150.254ZM150.254 55.0035V72.7465H131.962V55.0035H150.254ZM150.254 36.7535V54.4965H131.962V36.7535H150.254ZM150.254 18.5035V36.2465H131.962V18.5035H150.254ZM19.0757 127.497H37.3675V109.753H19.0757V127.497ZM37.8902 127.497H56.182V109.753H37.8902V127.497ZM56.7046 127.497H74.9964V109.753H56.7046V127.497ZM75.519 127.497H93.8108V109.753H75.519V127.497ZM94.3335 127.497H112.625V109.753H94.3335V127.497ZM113.148 127.497H131.44V109.753H113.148V127.497ZM131.44 91.5035V109.247H113.148V91.5035H131.44ZM131.44 73.2535V90.9965H113.148V73.2535H131.44ZM131.44 55.0035V72.7465H113.148V55.0035H131.44ZM131.44 36.7535V54.4965H113.148V36.7535H131.44ZM131.44 18.5035V36.2465H113.148V18.5035H131.44ZM19.0757 109.247H37.3675V91.5035H19.0757V109.247ZM37.8902 109.247H56.182V91.5035H37.8902V109.247ZM56.7046 109.247H74.9964V91.5035H56.7046V109.247ZM75.519 109.247H93.8108V91.5035H75.519V109.247ZM94.3335 109.247H112.625V91.5035H94.3335V109.247ZM112.625 73.2535V90.9965H94.3335V73.2535H112.625ZM112.625 55.0035V72.7465H94.3335V55.0035H112.625ZM112.625 36.7535V54.4965H94.3335V36.7535H112.625ZM112.625 18.5035V36.2465H94.3335V18.5035H112.625ZM19.0757 90.9965H37.3675V73.2535H19.0757V90.9965ZM37.8902 90.9965H56.182V73.2535H37.8902V90.9965ZM56.7046 90.9965H74.9964V73.2535H56.7046V90.9965ZM75.519 90.9965H93.8108V73.2535H75.519V90.9965ZM93.8108 55.0035V72.7465H75.519V55.0035H93.8108ZM93.8108 36.7535V54.4965H75.519V36.7535H93.8108ZM93.8108 18.5035V36.2465H75.519V18.5035H93.8108ZM19.0757 72.7465H37.3675V55.0035H19.0757V72.7465ZM37.8902 72.7465H56.182V55.0035L37.8902 55.0035V72.7465ZM56.7046 72.7465H74.9964V55.0035H56.7046V72.7465ZM74.9964 36.7535V54.4965H56.7046V36.7535H74.9964ZM74.9964 18.5035V36.2465H56.7046V18.5035H74.9964ZM19.0757 54.4965H37.3675V36.7535H19.0757V54.4965ZM37.8902 54.4965L56.182 54.4965V36.7535H37.8902V54.4965ZM56.182 18.5035V36.2465H37.8902V18.5035H56.182ZM19.0757 36.2465H37.3675V18.5035H19.0757V36.2465Z"
        fill="url(#fipsCubeBackdropRadial)"
      />
      <defs>
        <radialGradient
          id="fipsCubeBackdropRadial"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(150.515 146) rotate(90) scale(146 150.515)"
        >
          <stop stopColor="#640DFB" />
          <stop offset="1" stopColor="#640DFB" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
