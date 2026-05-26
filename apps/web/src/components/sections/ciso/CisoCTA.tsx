import type React from "react";
import Link from "next/link";

/*
 * ── DESKTOP — Figma node 817:11498 — 1276×330px card ─────────────────────────
 * Background: linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)
 * Border-radius: 40px (applied by Footer wrapper)
 *
 * Content block: left=122px, right=107px, top=85px, flex row, gap=115px
 *   Left: heading w=462px — Manrope Bold 55px, lh=1, tracking=-0.05em, white
 *   Right: w=493px, flex-col, gap=24px
 *     Desc: Sora Regular 21px, opacity=0.8, tracking=-0.04em, lh=1.4
 *     Button: cs-btn-glass — Manrope Medium 18px, #111, border #dab6f3
 *
 * Cube: 255×259px at right side, overflows right+bottom, opacity=0.8
 * Cyan glow: left=-139px, top=-168px, 320×320px, rgba(44,193,235,0.12), blur 80px
 *
 * ── MOBILE — Figma node 856:1031 — 328×338px card ────────────────────────────
 * Border-radius: 24px (applied by Footer wrapper: rounded-3xl)
 *
 * Heading: absolute, top=32px, w=260px, centered
 *   Manrope Bold, 28px, lh=1.2, color=white
 * Description: absolute, top=150px, w=265px, centered
 *   Sora Regular, 16px, lh=1.4, tracking=−1.12px, white opacity 80%
 * Button: absolute, top=262px, centered
 *   border: 1px solid #dab6f3, radius=8px, px=24px py=12px
 *   bg: white 65% + radial gradients, Manrope Medium 16px, tracking=−0.8px, #111
 * Cube: bottom-right corner, ~80px, opacity=0.8, overflow clips via card
 */

export function CisoCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)",
      }}
    >
      {/* ── Cyan glow — top-left (both breakpoints) ── */}
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

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE (< sm) — absolute-positioned layout matching node 856:1031
          Card: 328×338px provided by Footer wrapper
      ════════════════════════════════════════════════════════════════════ */}
      <div className="sm:hidden absolute inset-0">

        {/* Cube — bottom-right, partially clipped by card overflow:hidden */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/cta-cube-noise.png"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            right: "-20px",
            bottom: "-24px",
            width: "88px",
            height: "88px",
            objectFit: "contain",
            opacity: 0.8,
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Heading — top=32px, w=260px, centered */}
        <p
          className="absolute text-center text-white"
          style={{
            top: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "260px",
            fontFamily: "var(--font-display)",
            // Strict-fonts: global CTA-card title token replaces the literal.
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
          }}
        >
          Strengthen Your Software Supply Chain Foundations
        </p>

        {/* Description — top=150px, w=265px, centered, opacity 80% */}
        <p
          className="absolute text-center text-white"
          style={{
            top: "150px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "265px",
            fontFamily: "var(--font-sans)",
            // Strict-fonts: global CTA-card desc token replaces the literal.
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            opacity: 0.8,
          }}
        >
          Reduce inherited software risk with minimal, hardened, verifiable
          container images built for enterprise environments.
        </p>

        {/* Button — top=262px, centered */}
        <div
          className="absolute"
          style={{ top: "262px", left: "50%", transform: "translateX(-50%)" }}
        >
          <Link
            href="/contact-us"
            className="cs-btn-glass"
            style={
              {
                "--cs-btn-px": "24px",
                "--cs-btn-fs": "16px",
                "--cs-btn-h": "44px",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                letterSpacing: "-0.8px",
                color: "#111",
                border: "1px solid #dab6f3",
                whiteSpace: "nowrap",
              } as React.CSSProperties
            }
          >
            Read the Executive Brief
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP (≥ sm) — flex-row layout matching node 817:11498
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block relative w-full h-full">

        {/* Cube decoration — 255×259px, overflows right + bottom edges */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/ciso/cta-cube-noise.png"
          alt=""
          className="absolute pointer-events-none select-none"
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

        {/* Content row — left=122px, right=107px, top≈85px, gap=115px */}
        <div
          className="relative flex flex-row items-start h-full"
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
              // Strict-fonts: global CTA-card title token.
              fontSize: "var(--cta-card-title)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
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
            {/* Description */}
            <p
              style={{
                fontFamily: "var(--font-sans)",
                // Strict-fonts: global CTA-card desc token.
                fontSize: "var(--cta-card-desc)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                color: "rgba(255, 255, 255, 0.8)",
              }}
            >
              Reduce inherited software risk with minimal, hardened, verifiable
              container images built for enterprise environments.
            </p>

            {/* Button */}
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
    </div>
  );
}
