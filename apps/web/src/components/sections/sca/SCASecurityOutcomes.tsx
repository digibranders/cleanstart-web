"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Security Outcomes — Figma node 604:3017
 * 2×2 CSS Grid: dark stat cards (top) + white feature cards (bottom)
 * 3D shield (Figma PNG + CleanStart emblem) centred, overlapping both rows
 * Stat numbers animate from 0 → target when section enters viewport
 */

/* ─── Counter hook ───────────────────────────────────────── */

function useCountUp(
  target: number,
  duration: number,
  triggered: boolean,
): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!triggered) return;

    let raf: number;
    const startTime = performance.now();

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - (1 - progress) ** 4;
      setCount(Math.round(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [triggered, target, duration]);

  return count;
}

/* ─── CleanStart emblem (inline SVG) ────────────────────── */

function ShieldEmblem(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 110.515 129.179"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden
    >
      <path
        d="M96.3612 41.6787V89.0428L62.4585 109.806V61.658L49.2803 69.4299L49.6508 69.6447V125.754L55.258 129.179L110.515 96.1323V33.6035L110.28 33.4645L96.3612 41.6787Z"
        fill="#2CC1EB"
      />
      <path
        d="M62.4576 61.442L20.2799 36.0413L55.7759 16.1124L96.348 39.8703V41.6648L110.267 33.4506L54.9854 4.29153e-06L0 33.5896V95.3096L12.82 103.157V47.5158L49.2794 69.4161L62.4576 61.6442V61.442Z"
        fill="white"
      />
    </svg>
  );
}

/* ─── Shared styles ──────────────────────────────────────── */

/*
 * Dark "stat" card.
 *
 * Figma 857:9953 stacks five visual layers; we render them as positioned
 * children of the card so the geometry scales with the card box:
 *
 *   1. Base linear gradient (top→bottom dark-navy→indigo→violet)
 *   2. Radial gradient border highlighting the top-right (#dab6f3 → 0)
 *   3. Cyan halo (#04C7F2) — wide, heavily blurred, ~70% opacity, anchored
 *      to the card's upper band; gives the card its characteristic cyan
 *      gleam along the top edge.
 *   4. Violet halo (#5D04D7) — heavily blurred, ~34% opacity, anchored to
 *      the lower-left; produces the purple under-glow.
 *   5. Soft black ellipse (opacity 0.2) tucked just outside the upper-right
 *      corner, adding a subtle vignette that lets the highlight read.
 *
 * Positions are expressed as % of the card box so the layers stay anchored
 * at every viewport (cards are flex/minHeight-driven, not fixed at 328×105).
 */
const TOP_CARD_SHELL: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(180deg, #151021 0%, #131e8f 71.202%, #551ece 100%)",
  borderRadius: "24px",
  boxShadow:
    "-4.5px 2.25px 11.26px rgba(0,0,0,0.23),-18.57px 9px 20.82px rgba(0,0,0,0.2),-41.65px 20.82px 27.58px rgba(0,0,0,0.12)",
  minHeight: "clamp(140px, 16.3vw, 209px)",
  isolation: "isolate", // contain blurs inside the rounded corners
};

function TopCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={className} style={TOP_CARD_SHELL}>
      {/* Layer 3 — cyan halo (top-anchored, wide) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-6.4%",
          top: "-78.5%",
          width: "174.3%",
          height: "237%",
          borderRadius: "50%",
          background: "#04C7F2",
          opacity: 0.7,
          filter: "blur(81.04px)",
        }}
      />

      {/* Layer 4 — violet halo (lower-left) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-45.5%",
          top: "13.1%",
          width: "108.6%",
          height: "147.6%",
          borderRadius: "50%",
          background: "#5D04D7",
          opacity: 0.34,
          filter: "blur(81.04px)",
        }}
      />

      {/* Layer 5 — black vignette just outside top-right corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "64.7%",
          top: "-132.4%",
          width: "42.2%",
          height: "56%",
          borderRadius: "50%",
          background: "#000",
          opacity: 0.2,
        }}
      />

      {/* Layer 2 — radial-gradient border highlight (top-right) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "24px",
          padding: "1.688px",
          background:
            "radial-gradient(circle at 90% 13%, rgba(218,182,243,1) 0%, rgba(218,182,243,0) 100%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/*
       * Figma effects on the card surface:
       *   • Layer blur — a soft Gaussian blur copy of the gradient base
       *     softens the seams between the cyan/violet halos and the
       *     underlying gradient so they read as one diffused surface
       *     instead of three discrete blobs.
       *   • Noise — fractal-noise grain (SVG feTurbulence) overlaid with
       *     mix-blend-mode: overlay, low opacity. Adds the film-grain
       *     texture from the Effects panel without dragging in a bitmap.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #151021 0%, #131e8f 71.202%, #551ece 100%)",
          filter: "blur(6px)",
          opacity: 0.45,
          mixBlendMode: "soft-light",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "220px 220px",
          opacity: 0.18,
          mixBlendMode: "overlay",
        }}
      />

      {/* Content slot */}
      <div
        className="relative flex flex-col justify-center h-full"
        style={{
          padding: "clamp(20px,2.5vw,32px) clamp(20px,2.8vw,36px)",
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const BOTTOM_CARD: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "24px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  padding: "clamp(20px,2.5vw,32px) clamp(20px,2.8vw,36px)",
  minHeight: "clamp(140px, 16.1vw, 209px)",
};

const STAT_NUM: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h2)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  color: "#ffffff",
};

const STAT_LABEL: React.CSSProperties = {
  marginTop: "clamp(6px,0.83vw,12px)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.4,
  color: "rgba(255,255,255,0.8)",
};

const FEAT_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h3)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  color: "#111111",
};

const FEAT_DESC: React.CSSProperties = {
  marginTop: "clamp(6px,0.83vw,12px)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.4,
  color: "#111111",
};

/*
 * Shield overlap math (Figma 1920px canvas, content 1276px):
 *   shield width  = 34.8% of content = 444px
 *   column gap    = 86px
 *   overlap/card  = (444 − 86) / 2 = 179px  →  14.05vw
 *
 * Right cards need paddingLeft ≥ overlap to keep text visible at lg+ where
 * the shield overlaps the 2×2 grid. Applied as `lg:!pl-[clamp(100px,15vw,195px)]`
 * on each right card so it doesn't waste mobile space (where the cards stack
 * one-per-row and the shield is hidden).
 */

/* ─── Component ─────────────────────────────────────────── */

export function SCASecurityOutcomes(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const [triggered, setTriggered] = useState(false);

  /* Trigger counters once section is 30% visible */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count89 = useCountUp(89, 1800, triggered);
  const count75 = useCountUp(75, 1600, triggered);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
    >
      <div
        className="relative mx-auto"
        style={{
          maxWidth: "1276px",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "clamp(48px, 6vw, 80px)",
          paddingBottom: "clamp(48px, 6vw, 80px)",
        }}
      >
        {/* ── Heading ── */}
        <h2
          className="text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
          }}
        >
          <span style={{ color: "#ffffff" }}>Security </span>
          <span className="cs-text-gradient-impact">Outcomes</span>
        </h2>

        {/* ── Card grid + shield ── */}
        <div className="relative" style={{ marginTop: "60px" }}>

          {/* Shield — centred, spans both rows. Hidden on mobile because the
              cards stack 1-per-row there; the shield only makes sense over
              the 2×2 desktop grid. */}
          <div
            aria-hidden
            className="pointer-events-none select-none absolute hidden lg:block"
            style={{
              left: "50%",
              transform: "translateX(-50%)",
              top: "-8px",
              zIndex: 10,
              width: "clamp(180px,34.8%,444px)",
              aspectRatio: "444 / 470",
              overflow: "hidden",
            }}
          >
            {/* 3D shield PNG (Figma crop: 196.86% wide, offset −49.08% left, −19.78% top) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sca/security-shield.png"
              alt=""
              style={{
                position: "absolute",
                width: "196.86%",
                height: "139.48%",
                left: "-49.08%",
                top: "-19.78%",
                maxWidth: "none",
              }}
              decoding="async"
            />

            {/* CleanStart emblem — centred on shield face */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "52%",
                transform: "translate(-50%,-50%)",
                width: "17%",
                aspectRatio: "110.515 / 129.179",
              }}
            >
              <ShieldEmblem />
            </div>
          </div>

          {/* Card grid — mobile: 1-col stacked alternating blue/white per
              reference, lg+: original 2×2 with the shield overlap. Mobile
              order is controlled via `order-*` utilities so each card lands
              in the right slot of the stack without changing DOM order
              (which the lg grid still consumes left-to-right, top-to-bottom). */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-y-4 lg:gap-y-[clamp(8px,3.4vw,44px)] lg:gap-x-[clamp(40px,6.7vw,86px)]"
          >
            {/* Top-left — 89% (mobile slot 1) */}
            <TopCard className="order-1 lg:order-none">
              <p style={STAT_NUM}>{count89}%</p>
              <p style={STAT_LABEL}>Fewer inherited vulnerabilities</p>
            </TopCard>

            {/* Top-right — 75% (mobile slot 3; lg+ gets extra left padding
                to clear the shield via !pl which beats the inline padding
                shorthand). */}
            <TopCard className="order-3 lg:order-none lg:[&>div:last-child]:!pl-[clamp(100px,15vw,195px)]">
              <p style={STAT_NUM}>{count75}%</p>
              <p style={STAT_LABEL}>Faster remediation cycles</p>
            </TopCard>

            {/* Bottom-left — Smaller SBOMs (mobile slot 2) */}
            <div className="order-2 lg:order-none" style={BOTTOM_CARD}>
              <p style={FEAT_TITLE}>Smaller SBOMs</p>
              <p style={FEAT_DESC}>Reduced dependency complexity</p>
            </div>

            {/* Bottom-right — Faster Reviews (mobile slot 4; lg+ gets the
                same shield-clearance left padding as the 75% card above). */}
            <div
              className="order-4 lg:order-none lg:!pl-[clamp(100px,15vw,195px)]"
              style={BOTTOM_CARD}
            >
              <p style={FEAT_TITLE}>Faster Reviews</p>
              <p style={FEAT_DESC}>Improved triage and prioritization</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
