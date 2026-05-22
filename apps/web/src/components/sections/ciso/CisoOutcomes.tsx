"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

/*
 * Figma node 583:2556 — 1920px wide
 *
 * Background: linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)
 * paddingTop: 120px
 *
 * Heading: "Security Outcomes" — 62px Manrope Bold, centered
 *   "Outcomes" has gradient fill (107.15deg, #9A51FF → #2CC1EB)
 *
 * 4 stat cards — all 295px wide, gap=32px → 4×295+3×32=1276px (no padding needed)
 *   Tall cards (1 & 3): h=326px, top=263px in section
 *   Short cards (2 & 4): h=258px, top=331px (68px lower, bottom aligns at 589px)
 *   Card border-radius: 24px, bg: white, overflow: clip
 *
 * Number: left=32px, bottom edge at 106px from card top (translateY(-100%) from top=106)
 *   Font: Manrope Bold, 62px, lh=1.2, color #111
 * Label: left-aligned at left=32px
 *   Tall cards: top=232px; Short cards: top=164px
 *   Font: Sora Regular, 22px, tracking -0.05em, lh=1.4, color #333
 *
 * Bottom decorations:
 *   Glow bars: 3 horizontal lines at top=633px in section (full-width, rotated PNGs)
 *   Teal flares: 652×145px, mix-blend-screen, bottom=77px in section, one per card column
 *     Left positions in section: 139px, 469px, 799px, 1129px
 *
 * Corner vectors: 979×979 SVG decorators
 *   Top-right: section left=1431px, top=-339px
 *   Bottom-left: section left=-561px, top=67px
 * Center vector: 803×803, centered, top=-56px relative to content
 */

// ─── Counter animation hook ───────────────────────────────────────────────────
function useCounter(target: number, duration = 1800, enabled = false): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    let rafId: number;
    const startTime = performance.now();

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out: fast start, slow finish
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return (): void => cancelAnimationFrame(rafId);
  }, [target, duration, enabled]);

  return count;
}

// ─── Stat card data ───────────────────────────────────────────────────────────
interface StatDef {
  // If target is a number, animate counter; if null use display string as-is
  target: number | null;
  display: string;      // full display string (used when target is null)
  suffix: string;       // appended after animated count
  label: string;
  tall: boolean;        // true=326px height; false=258px height
}

const STATS: StatDef[] = [
  { target: 89,   display: "89%",  suffix: "%",  label: "Fewer inherited vulnerabilities", tall: true  },
  { target: 70,   display: "70%+", suffix: "%+", label: "Smaller software inventories",    tall: false },
  { target: null, display: "2–3x", suffix: "",   label: "Faster remediation cycles",       tall: true  },
  { target: 40,   display: "40%",  suffix: "%",  label: "Lower remediation workload",      tall: false },
];

// ─── Single stat card ─────────────────────────────────────────────────────────
function StatCard({
  stat,
  enabled,
}: {
  stat: StatDef;
  enabled: boolean;
}): React.ReactElement {
  // Only animate numeric targets; ranges ("2–3x") stay static
  const count = useCounter(stat.target ?? 0, 1800, enabled && stat.target !== null);
  const displayValue =
    stat.target !== null ? `${count}${stat.suffix}` : stat.display;

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        width: "295px",
        height: stat.tall ? "326px" : "258px",
        borderRadius: "24px",
        backgroundColor: "#fff",
        marginTop: stat.tall ? "0px" : "68px",
      }}
    >
      {/* ── Animated number ──
          bottom edge pinned at 106px from card top via translateY(-100%) */}
      <div
        className="absolute whitespace-nowrap"
        style={{
          left: "32px",
          top: "106px",
          transform: "translateY(-100%)",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-t-display-2)",
          fontWeight: 700,
          letterSpacing: "var(--text-t-display-2-ls)",
          lineHeight: "var(--text-t-display-2-lh)",
          color: "#111",
        }}
      >
        {displayValue}
      </div>

      {/* ── Description label ──
          Tall cards: top=232px | Short cards: top=164px */}
      <div
        className="absolute"
        style={{
          left: "32px",
          top: stat.tall ? "232px" : "164px",
          width: "231px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-t-subhead)",
            fontWeight: 400,
            letterSpacing: "var(--text-t-subhead-ls)",
            lineHeight: "var(--text-t-subhead-lh)",
            color: "#333",
          }}
        >
          {stat.label}
        </p>
      </div>
    </div>
  );
}

// ─── Bottom teal flare ────────────────────────────────────────────────────────
// Each flare: 652×145px outer, mix-blend-screen; glow extends -100% below (total 290px)
// Mask shapes the glow into an oval spotlight
function BottomFlare({ left }: { left: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none select-none"
      style={{
        left,
        bottom: "77px",
        width: "652px",
        height: "145px",
        mixBlendMode: "screen",
      }}
    >
      {/* Glow extends 100% below container for soft fade */}
      <div
        className="absolute"
        style={{ inset: "0 0 -100% 0" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ciso/outcomes-flare.svg"
          alt=""
          className="absolute"
          style={{
            inset: "0 0 -100% 0",
            width: "100%",
            height: "200%",
            objectFit: "fill",
            maskImage:
              "url('/images/ciso/outcomes-flare-mask1.svg'), url('/images/ciso/outcomes-flare-mask2.png')",
            WebkitMaskImage:
              "url('/images/ciso/outcomes-flare-mask1.svg'), url('/images/ciso/outcomes-flare-mask2.png')",
            maskMode: "alpha",
            maskComposite: "intersect",
            maskRepeat: "no-repeat",
            maskSize: "100% 50%, 100% 50%",
            maskPosition: "0px 0px, 0px 0px",
          }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

// ─── Horizontal glow bar (rotated PNG technique from Figma) ───────────────────
function GlowBar({
  src,
  height,
  opacity,
  top,
}: {
  src: string;
  height: number;
  opacity: number;
  top: number;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none select-none left-0 right-0 flex items-center justify-center"
      style={{ top: `${top}px`, height: `${height}px`, opacity }}
    >
      {/* Rotate the PNG 90° so vertical gradient becomes horizontal */}
      <div
        style={{
          flexShrink: 0,
          transform: "rotate(90deg)",
          width: `${height}px`,
          height: "1930px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "fill" }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CisoOutcomes(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const [animated, setAnimated] = useState(false);

  // Trigger counters once section is 20% visible
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return (): void => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-section="CisoOutcomes"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
        paddingTop: "120px",
        paddingBottom: "200px", // room for glow bars + flares below cards
      }}
    >
      {/* ── Corner vector — top-right: frame left=1431 → section-absolute ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/outcomes-vector-corner.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "calc(50% + 471px)",
          top: "-339px",
          width: "979px",
          height: "979px",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Corner vector — bottom-left: frame left=-561 → section-absolute ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/outcomes-vector-corner.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "calc(50% - 1521px)",
          top: "67px",
          width: "979px",
          height: "979px",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Bottom glow bars — horizontal gradient lines at top=633px ── */}
      <GlowBar
        src="/images/ciso/outcomes-glow-bar1.png"
        height={131}
        opacity={0.4}
        top={633}
      />
      <GlowBar
        src="/images/ciso/outcomes-glow-bar2.png"
        height={51}
        opacity={0.3}
        top={633}
      />

      {/* ── Bottom teal flares — one per card column ── */}
      {/* Section-relative left positions: 139, 469, 799, 1129px */}
      <BottomFlare left="139px" />
      <BottomFlare left="469px" />
      <BottomFlare left="799px" />
      <BottomFlare left="1129px" />

      {/* ── 1276px content container ── */}
      <div className="relative mx-auto" style={{ maxWidth: "1276px" }}>

        {/* ── Center decorative vector — 803×803, centered, top=-56px ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-center.svg"
          alt=""
          className="absolute pointer-events-none select-none hidden xl:block"
          style={{
            left: "50%",
            top: "-56px",
            transform: "translateX(-50%)",
            width: "803px",
            height: "803px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* ── Heading ── */}
        <div
          className="relative text-center px-6"
          style={{ marginBottom: "80px" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-t-display-2)",
              fontWeight: 700,
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
              color: "#fff",
            }}
          >
            Security{" "}
            <span
              style={{
                background:
                  "linear-gradient(107.15deg, rgb(154, 81, 255) 1.758%, rgb(44, 193, 235) 98.781%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Outcomes
            </span>
          </h2>
        </div>

        {/* ════════ DESKTOP — 4 staggered cards, no horizontal padding ════════
             4×295 + 3×32 = 1276px fills container exactly.
             Tall cards (1 & 3): h=326px, no top offset.
             Short cards (2 & 4): h=258px, marginTop=68px (bottom-aligns all cards). */}
        <div className="hidden xl:flex items-start" style={{ gap: "32px" }}>
          {STATS.map((stat) => (
            <StatCard key={stat.display} stat={stat} enabled={animated} />
          ))}
        </div>

        {/* ════════ MOBILE — 2-column grid ════════ */}
        <div
          className="xl:hidden grid grid-cols-2 gap-4 px-4 sm:px-6"
        >
          {STATS.map((stat) => (
            <div
              key={stat.display}
              className="bg-white flex flex-col"
              style={{ borderRadius: "20px", padding: "28px 20px", gap: "12px" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-t-display-2)",
                  fontWeight: 700,
                  letterSpacing: "var(--text-t-display-2-ls)",
                  lineHeight: "var(--text-t-display-2-lh)",
                  color: "#111",
                }}
              >
                {stat.display}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-t-body-md)",
                  fontWeight: 400,
                  letterSpacing: "var(--text-t-body-md-ls)",
                  lineHeight: "var(--text-t-body-md-lh)",
                  color: "#333",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
