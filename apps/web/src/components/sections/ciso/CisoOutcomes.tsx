"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

/*
 * ── DESKTOP — Figma node 583:2556 — 1920px wide ──────────────────────────────
 * Background: linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)
 * paddingTop: 120px / paddingBottom: 200px
 *
 * Heading: "Security Outcomes" — 62px Manrope SemiBold, centered
 *   "Outcomes" gradient 107.15deg #9A51FF → #2CC1EB, marginBottom 80px
 *
 * 4 stat cards — 295px wide, gap=32px → 4×295+3×32=1276px
 *   Tall (1 & 3): h=326px | Short (2 & 4): h=258px, marginTop=68px
 *   Border-radius: 24px, bg: white
 * Number: left=32, top=106px (translateY-100%), Manrope Bold 62px, #111
 * Label:  left=32, Tall top=222px / Short top=154px, Sora 22px, #333
 *
 * Decorations: corner vectors (top-right & bottom-left), glow bars at top=633px,
 *   teal flares at left=139/469/799/1129px, center vector 803×803 top=-56px
 *
 * ── MOBILE — Figma node 856:1330 — 360px wide ────────────────────────────────
 * Section height: ~816px
 *
 * Heading: absolute, top=32px, left=50%-0.5px (centered), width=211px
 *   Manrope SemiBold 28px, lh=1.2
 *   "Security " white · "Outcomes " gradient 96.45deg #9A51FF→#2CC1EB
 *
 * Cards container: absolute, top=124px, left=50% (centered), width=328px
 *   flex-col, gap=16px
 *   Each card: 328×144px, borderRadius=20px, bg=#fff,
 *     boxShadow="0px 4px 20px 0px rgba(0,0,0,0.08)"
 *   Number: left=32, top=32, Manrope Bold 40px, lh=1.2, color=#000
 *   Label:  left=32, top=92, width=280px, 16px Regular, tracking=-0.8px, #333
 *
 * Mobile card values:  89% · +70% · 2–3x · 40%
 *
 * Background (mobile):
 *   Center vector: left=50%+0.5px (centered), top=-56px, 803×803px
 *   Left vector:   left=-72px, top=-81px, 463×463px
 *
 * Mobile bottom decorations:
 *   Glow bar (856:1336): left=-36.55px, top=782.04px, 1340.273×87.964px
 *   Flare  (856:1340):   left=-31px, bottom=34.64px, 437.805×97.365px, mix-blend-screen
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
  target: number | null;
  display: string;       // desktop display (used when target is null or for desktop)
  mobileDisplay: string; // mobile display (pre-formatted, used for non-animated mobile)
  mobilePrefix: string;  // prefix before animated count on mobile (e.g. "+" for "+70%")
  suffix: string;        // appended after animated count on desktop
  mobileSuffix: string;  // appended after animated count on mobile
  line1: string;
  line2: string;
  tall: boolean;         // desktop only: true=326px, false=258px
}

const STATS: StatDef[] = [
  {
    target: 89,   display: "89%",  mobileDisplay: "89%",  mobilePrefix: "",  suffix: "%",  mobileSuffix: "%",
    line1: "Fewer inherited",    line2: "vulnerabilities",  tall: true,
  },
  {
    target: 70,   display: "70%+", mobileDisplay: "+70%", mobilePrefix: "+", suffix: "%+", mobileSuffix: "%",
    line1: "Smaller software",   line2: "inventories",      tall: false,
  },
  {
    target: null, display: "2–3x", mobileDisplay: "2–3x", mobilePrefix: "",  suffix: "",   mobileSuffix: "",
    line1: "Faster remediation", line2: "cycles",           tall: true,
  },
  {
    target: 40,   display: "40%",  mobileDisplay: "40%",  mobilePrefix: "",  suffix: "%",  mobileSuffix: "%",
    line1: "Lower remediation",  line2: "workload",         tall: false,
  },
];

// ─── Desktop stat card ────────────────────────────────────────────────────────
function StatCard({
  stat,
  enabled,
}: {
  stat: StatDef;
  enabled: boolean;
}): React.ReactElement {
  const count = useCounter(stat.target ?? 0, 1800, enabled && stat.target !== null);
  const displayValue =
    stat.target !== null ? `${count}${stat.suffix}` : stat.display;

  return (
    <div
      className={`relative w-full overflow-hidden h-[326px] xl:w-[295px] xl:flex-shrink-0 ${
        stat.tall ? "xl:h-[326px] xl:mt-0" : "xl:h-[258px] xl:mt-[68px]"
      }`}
      style={{
        borderRadius: "24px",
        backgroundColor: "#fff",
      }}
    >
      <div
        className="absolute whitespace-nowrap"
        style={{
          left: "32px",
          top: "106px",
          transform: "translateY(-100%)",
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-display)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.2,
          color: "#111",
        }}
      >
        {displayValue}
      </div>

      <div
        className="absolute"
        style={{
          left: "32px",
          top: stat.tall ? "222px" : "154px",
          width: "231px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            color: "#333",
          }}
        >
          {stat.line1}
          <br />
          {stat.line2}
        </p>
      </div>
    </div>
  );
}

// ─── Mobile stat card ─────────────────────────────────────────────────────────
// Figma 856:1347–1366: 328×144px, borderRadius 20px, shadow
// Number: left=32, top=32, 40px Bold, color #000
// Label:  left=32, top=92, width=280px, 16px, tracking=-0.8px, #333
function MobileStatCard({
  stat,
  enabled,
}: {
  stat: StatDef;
  enabled: boolean;
}): React.ReactElement {
  const count = useCounter(stat.target ?? 0, 1800, enabled && stat.target !== null);
  const displayValue =
    stat.target !== null
      ? `${stat.mobilePrefix}${count}${stat.mobileSuffix}`
      : stat.mobileDisplay;

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: "328px",
        height: "144px",
        borderRadius: "20px",
        backgroundColor: "#fff",
        boxShadow: "0px 4px 20px 0px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Number — left=32, top=32 */}
      {/* TODO: needs new --stat-number-* token */}
      <div
        className="absolute whitespace-nowrap"
        style={{
          left: "32px",
          top: "32px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-display)",
          fontWeight: 700,
          lineHeight: 1.2,
          color: "#000",
        }}
      >
        {displayValue}
      </div>

      {/* Label — left=32, top=92, width=280px */}
      <div
        className="absolute"
        style={{
          left: "32px",
          top: "92px",
          width: "280px",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 400,
          lineHeight: 1.4,
          letterSpacing: "-0.02em",
          color: "#333",
        }}
      >
        {stat.line1} {stat.line2}
      </div>
    </div>
  );
}

// ─── Desktop: bottom teal flare ───────────────────────────────────────────────
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
      <div className="absolute" style={{ inset: "0 0 -100% 0" }}>
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

// ─── Desktop: horizontal glow bar ─────────────────────────────────────────────
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
      }}
    >

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE (< md) — pixel-perfect per Figma 856:1330
          Section height: ~816px, all elements absolutely positioned
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className="md:hidden relative overflow-hidden"
        style={{ minHeight: "816px" }}
      >
        {/* Left vector — left=-72px, top=-81px, 463×463px */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-corner.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "-72px",
            top: "-81px",
            width: "463px",
            height: "463px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Center vector — left=50%+0.5px (centered), top=-56px, 803×803px */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-center.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "calc(50% + 0.5px)",
            top: "-56px",
            transform: "translateX(-50%)",
            width: "803px",
            height: "803px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Heading — 856:1345: top=32px, left=50%-0.5px, width=211px, centered */}
        {/* Manrope SemiBold 28px, lh=1.2 */}
        {/* "Security " white · "Outcomes " gradient 96.45deg #9A51FF→#2CC1EB */}
        <h2
          className="absolute text-center"
          style={{
            top: "32px",
            left: "calc(50% - 0.5px)",
            transform: "translateX(-50%)",
            width: "211px",
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.2,
            color: "#fff",
          }}
        >
          {"Security "}
          <span
            style={{
              background:
                "linear-gradient(96.45deg, #9A51FF 1.758%, #2CC1EB 98.781%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {"Outcomes "}
          </span>
        </h2>

        {/* Cards container — 856:1346: top=124px, left=50%, width=328px, flex-col gap=16px */}
        <div
          className="absolute flex flex-col"
          style={{
            top: "124px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "328px",
            gap: "16px",
          }}
        >
          {STATS.map((stat) => (
            <MobileStatCard key={stat.mobileDisplay + stat.line1} stat={stat} enabled={animated} />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TABLET + DESKTOP (≥ md)
            md–lg : 2×2 grid of uniform cards
            xl+   : full 1×4 staggered row per Figma 583:2556
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden md:block relative px-6 sm:px-10"
        style={{ paddingTop: "120px", paddingBottom: "200px" }}
      >
        {/* Corner vector — top-right: frame left=1431 → section-absolute */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-corner.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "calc(50% + 471px)",
            top: "-339px",
            width: "979px",
            height: "979px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Corner vector — bottom-left: frame left=-561 → section-absolute */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/outcomes-vector-corner.svg"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            left: "calc(50% - 1521px)",
            top: "67px",
            width: "979px",
            height: "979px",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Decorative track + per-column flares only fit the 4-wide row,
            so they're xl-only. Hidden at md–lg (2×2 grid). */}
        <div className="hidden xl:block">
          {/* Glow bars — horizontal gradient lines at top=633px */}
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

          {/* Bottom teal flares — one per card column */}
          <BottomFlare left="139px" />
          <BottomFlare left="469px" />
          <BottomFlare left="799px" />
          <BottomFlare left="1129px" />
        </div>

        {/* 1276px content container */}
        <div className="relative mx-auto" style={{ maxWidth: "1276px" }}>

          {/* Center decorative vector — 803×803, centered, top=-56px */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/ciso/outcomes-vector-center.svg"
            alt=""
            className="absolute pointer-events-none select-none"
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

          {/* Heading */}
          <Reveal
            header
            className="relative text-center px-6"
            style={{ marginBottom: "80px" }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "#fff",
              }}
            >
              Security{" "}
              <span className="cs-text-gradient-impact">Outcomes</span>
            </h2>
          </Reveal>

          {/* Cards
                md–lg → 2×2 grid (uniform cards via items-stretch)
                xl+   → flex row with staggered tall/short per Figma */}
          <RevealStagger className="grid grid-cols-2 items-stretch gap-6 lg:gap-8 xl:flex xl:items-start xl:gap-[32px]">
            {STATS.map((stat) => (
              <RevealItem key={stat.display}>
                <StatCard stat={stat} enabled={animated} />
              </RevealItem>
            ))}
          </RevealStagger>

        </div>
      </div>

    </section>
  );
}
