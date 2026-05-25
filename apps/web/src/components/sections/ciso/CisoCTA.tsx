import type React from "react";
import Link from "next/link";

/*
 * Figma node 817:11498 — 1276×330px CTA card (positioned by Footer at top:-170px)
 *
 * Background: linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)
 * Border-radius: 40px (applied by Footer wrapper, overflow:hidden clips cube)
 *
 * Content block: left=122px, right=107px, top=85px, flex row, gap=115px
 *   Left column (heading): w=462px
 *     Manrope Bold 55px, lh=1, tracking=-2.75px (-0.05em), white
 *   Right column: w=493px, flex-col, gap=24px
 *     Description: Sora Regular 21px, opacity=0.8, tracking=-0.84px (-0.04em), lh=1.4
 *     Button: cs-btn-glass, Manrope Medium 18px, #111, border #dab6f3
 *
 * Cube: 255×259px at right side, overflows right+bottom, opacity=0.8, rotate(-0.15deg)
 *   Figma position: left=1054px, top=167px in 1276px-wide card
 *
 * Cyan glow: left=-139px, top=-168px, 320×320px, rgba(44,193,235,0.12), blur 80px
 */

export function CisoCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)",
      }}
    >
      {/* ── Cyan glow — top-left ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(44, 193, 235, 0.12)",
          filter: "blur(80px)",
        }}
      />

      {/* ── Cube decoration — overflows right + bottom edges ──
          Figma: left=1054, top=167 in 1276px card → near-right, below center.
          255×259px, opacity 0.8, slight -0.15deg tilt. Clipped by overflow:hidden. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/cta-cube-noise.png"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          right: "-30px",
          bottom: "-40px",
          width: "255px",
          height: "259px",
          objectFit: "contain",
          opacity: 0.8,
          transform: "rotate(-0.15deg)",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Content row ──
          Desktop: left=122px, right=107px, top≈85px, gap=115px between two columns.
          Mobile: stacked column with responsive padding. */}
      <div
        className="relative flex flex-col lg:flex-row lg:items-center"
        style={{
          padding: "clamp(40px, 4.43vw, 85px) clamp(32px, 6.35vw, 122px)",
          gap: "clamp(32px, 5.99vw, 115px)",
        }}
      >
        {/* Left: headline — Manrope Bold 55px, lh 1, tracking -0.05em */}
        <p
          className="relative text-white flex-shrink-0"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 2.86vw, 55px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            maxWidth: "min(462px, 100%)",
          }}
        >
          Strengthen Your Software Supply Chain Foundations
        </p>

        {/* Right: description + CTA button */}
        <div
          className="relative flex flex-col"
          style={{ maxWidth: "min(493px, 100%)", gap: "clamp(20px, 1.25vw, 24px)" }}
        >
          {/* Description — Sora Regular 21px, opacity 0.8, tracking -0.04em, lh 1.4 */}
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(15px, 1.09vw, 21px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            Reduce inherited software risk with minimal, hardened, verifiable
            container images built for enterprise environments.
          </p>

          {/* Button — Manrope Medium 18px, glassmorphic, #111 text */}
          <Link
            href="/contact-us"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "18px",
              } as React.CSSProperties
            }
          >
            <span>Read the Executive Brief</span>
            <svg
              className="cs-cta-arrow"
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
        </div>
      </div>
    </div>
  );
}
