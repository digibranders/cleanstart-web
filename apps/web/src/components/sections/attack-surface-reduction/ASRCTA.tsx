/**
 * Attack Surface Reduction CTA card — rendered inside the Footer's locked
 * CTA slot. Figma node 366:6867 (mobile) + desktop specs:
 *   bg: white · two #DF9BFF corner glow blobs · Union radial gradient
 *   title/body: dark #111 · button: solid blue #3960F9
 */

"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function ASRCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col items-center justify-center text-center gap-5 px-8 md:px-12 lg:grid lg:grid-cols-[minmax(0,460px)_minmax(0,460px)] lg:items-center lg:gap-x-[clamp(32px,5vw,72px)] lg:justify-center lg:text-left lg:p-[clamp(32px,4vw,48px)_clamp(32px,5vw,80px)]"
      style={{ background: "#FFFFFF" }}
    >
      {/* ── Mobile: top-left pink glow blob (Figma 366:6869) ─────────────────── */}
      {/* left=-159px top=-154px size=223.44px blur=53.1276px */}
      <div
        aria-hidden
        className="pointer-events-none absolute lg:hidden"
        style={{
          left: "-159px",
          top: "-154px",
          width: "223.44px",
          height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53.1276px)",
        }}
      />

      {/* ── Mobile: bottom-right pink glow blob ──────────────────────────────── */}
      {/* Figma: left=253px top=289px in 328×368 card → right=-148px bottom=-144px */}
      <div
        aria-hidden
        className="pointer-events-none absolute lg:hidden"
        style={{
          right: "-148px",
          bottom: "-144px",
          width: "223.44px",
          height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53.1276px)",
        }}
      />

      {/* ── Desktop: top-left pink glow blob (Ellipse 46683) ─────────────────── */}
      {/* left=-139px top=-168px size=320px blur=121.5px */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* ── Desktop: right pink glow blob (Ellipse 46682) ────────────────────── */}
      {/* left=1159px top=244px size=511px blur=121.5px — bleeds off right edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* ── Desktop: Union grid SVG ───────────────────────────────────────────── */}
      {/* Figma: left=547px top=-220px size=1101×1101px · opacity already baked in SVG path */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/cta-union-grid.svg"
        alt=""
        width={1101}
        height={1101}
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
        }}
        loading="eager"
        decoding="async"
      />

      {/* ── Mobile: Union hex decorative pattern (PNG) ───────────────────────── */}
      {/* Figma 366:6870 · left=56px top=98px size=378px — mobile only */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/cta-union.png"
        alt=""
        width={378}
        height={378}
        className="pointer-events-none select-none absolute lg:hidden"
        style={{
          left: "56px",
          top: "98px",
          width: "378px",
          height: "378px",
          objectFit: "contain",
          opacity: 0.12,
        }}
        loading="eager"
        decoding="async"
      />

      {/* ── Headline ─────────────────────────────────────────────────────────── */}
      <Reveal header className="relative z-10" style={{ maxWidth: "min(460px, 100%)" }}>
        <p
          className="font-display"
          style={{
            color: "#111111",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "var(--cta-card-title-ls)",
            lineHeight: "var(--cta-card-title-lh)",
            textWrap: "balance",
          }}
        >
          Reduce Attack Surface At The Source
        </p>
      </Reveal>

      {/* ── Body + blue CTA button ────────────────────────────────────────────── */}
      <Reveal header delay={0.15} y={20} className="relative z-10 flex flex-col items-center lg:items-start gap-[18px]">
        <p
          className="font-normal text-center lg:text-left"
          style={{
            color: "#111111",
            opacity: 0.8,
            maxWidth: "440px",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "var(--cta-card-desc-ls)",
            lineHeight: "var(--cta-card-desc-lh)",
          }}
        >
          Build with only what production needs.
        </p>

        {/* Solid blue button — Figma: #3960F9 h=44px radius=8px */}
        <Link
          href="/book-a-demo"
          className="inline-flex items-center gap-2 font-sans font-medium text-white shrink-0"
          style={{
            background: "#3960F9",
            borderRadius: "8px",
            height: "44px",
            paddingLeft: "24px",
            paddingRight: "24px",
            fontSize: "var(--fs-button)",
            letterSpacing: "-0.05em",
            whiteSpace: "nowrap",
            boxShadow:
              "0px 1px 2px -1px rgba(9,6,63,0.4), 0px 0px 0px 1px #3960F9, inset 0px 1px 0px 0px rgba(255,255,255,0.16)",
          }}
        >
          <span>Attack Surface Reduction</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 9h11m0 0l-4-4m4 4l-4 4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </Reveal>
    </div>
  );
}
