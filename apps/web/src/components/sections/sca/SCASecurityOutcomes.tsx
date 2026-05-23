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

const TOP_CARD: React.CSSProperties = {
  background:
    "linear-gradient(180deg, #151021 0%, #131e8f 71.202%, #551ece 100%)",
  border: "1.688px solid #dab6f3",
  borderRadius: "14px",
  boxShadow:
    "-4.5px 2.25px 11.26px rgba(0,0,0,0.23),-18.57px 9px 20.82px rgba(0,0,0,0.2),-41.65px 20.82px 27.58px rgba(0,0,0,0.12)",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  padding: "clamp(20px,2.5vw,32px) clamp(20px,2.8vw,36px)",
};

const BOTTOM_CARD: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "24px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  padding: "clamp(20px,2.5vw,32px) clamp(20px,2.8vw,36px)",
};

const STAT_NUM: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--text-t-display-1)",
  fontWeight: 700,
  letterSpacing: "var(--text-t-display-1-ls)",
  lineHeight: "var(--text-t-display-1-lh)",
  color: "#ffffff",
};

const STAT_LABEL: React.CSSProperties = {
  marginTop: "clamp(6px,0.83vw,12px)",
  fontFamily: "var(--font-sans)",
  fontSize: "clamp(20px, 2vw, 28px)",
  fontWeight: 500,
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
  color: "rgba(255,255,255,0.8)",
};

const FEAT_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(22px, 2.4vw, 32px)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  color: "#111111",
};

const FEAT_DESC: React.CSSProperties = {
  marginTop: "clamp(6px,0.83vw,12px)",
  fontFamily: "var(--font-sans)",
  fontSize: "clamp(15px, 1.4vw, 20px)",
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
 * Right cards need paddingLeft ≥ overlap to keep text visible.
 * We use clamp(100px, 15vw, 195px) with an extra margin.
 */
const RIGHT_CARD_PADDING_LEFT = "clamp(100px,15vw,195px)";

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
        minHeight: "900px",
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: "1276px", padding: "100px 24px 80px" }}
      >
        {/* ── Heading ── */}
        <h2
          className="text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
          }}
        >
          <span style={{ color: "#ffffff" }}>Security </span>
          <span className="cs-text-gradient-impact">outcomes</span>
        </h2>

        {/* ── Card grid + shield ── */}
        <div className="relative" style={{ marginTop: "60px" }}>

          {/* Shield — centred, spans both rows */}
          <div
            aria-hidden
            className="pointer-events-none select-none absolute"
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

          {/* 2 × 2 grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows:
                "clamp(140px,16.3vw,209px) clamp(140px,16.1vw,209px)",
              columnGap: "clamp(40px,6.7vw,86px)",
              rowGap: "clamp(8px,3.4vw,44px)",
            }}
          >
            {/* Top-left — 89% */}
            <div style={TOP_CARD}>
              <p style={STAT_NUM}>
                {count89}%
              </p>
              <p style={STAT_LABEL}>Fewer inherited vulnerabilities</p>
            </div>

            {/* Top-right — 75% (extra left padding to clear shield) */}
            <div
              style={{
                ...TOP_CARD,
                paddingLeft: RIGHT_CARD_PADDING_LEFT,
              }}
            >
              <p style={STAT_NUM}>
                {count75}%
              </p>
              <p style={STAT_LABEL}>Faster remediation cycles</p>
            </div>

            {/* Bottom-left — Smaller SBOMs */}
            <div style={BOTTOM_CARD}>
              <p style={FEAT_TITLE}>Smaller SBOMs</p>
              <p style={FEAT_DESC}>Reduced dependency complexity</p>
            </div>

            {/* Bottom-right — Faster Reviews (extra left padding to clear shield) */}
            <div
              style={{
                ...BOTTOM_CARD,
                paddingLeft: RIGHT_CARD_PADDING_LEFT,
              }}
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
