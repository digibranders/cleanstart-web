import type React from "react";
import Link from "next/link";

/**
 * SCA CTA — Figma node 604:3631 (1276×335 px card in Footer slot)
 *
 * Two-column layout: heading left, description + button right.
 * 3D teal cube peeks from the bottom-right corner (clips via parent overflow:hidden).
 *
 * Background: linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)
 * Heading:    clamp(26-44) / 600 / Manrope, white
 * Body:       clamp(16-20) / 400 / Sora, white @ 80%
 * Button:     "Make SCA Actionable" — glass
 */

export function SCACTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)",
      }}
    >
      {/* ── Decorative purple glow — right ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: "-60px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(154,81,255,0.2)",
          filter: "blur(80px)",
        }}
      />

      {/* ── Decorative cyan glow — top-left ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-80px",
          top: "-80px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "rgba(44,193,235,0.12)",
          filter: "blur(70px)",
        }}
      />

      {/* ── 3D teal cube — bottom-right corner (desktop only) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sca/cta-cube.png"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          right: "-20px",
          bottom: "-80px",
          width: "220px",
          height: "220px",
          objectFit: "contain",
          opacity: 0.75,
          zIndex: 0,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ══════════════════════════════════════════
          Desktop layout (md+) — heading left, desc+button right
      ══════════════════════════════════════════ */}
      <div
        className="hidden md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0 absolute inset-0 lg:items-center"
        style={{
          paddingLeft: "clamp(32px, 5vw, 80px)",
          paddingRight: "clamp(32px, 5vw, 80px)",
          paddingTop: "clamp(40px, 5vw, 80px)",
          paddingBottom: "clamp(40px, 5vw, 80px)",
          columnGap: "clamp(32px, 5vw, 72px)",
        }}
      >
        {/* Left column — heading, auto-wraps 2 or 3 lines via balance */}
        <p
          className="relative min-w-0 w-full text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.1vw, 44px)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "min(460px, 100%)",
            textWrap: "balance",
            margin: 0,
            zIndex: 1,
          }}
        >
          From Findings to Action
        </p>

        {/* Right column — description + button */}
        <div
          className="flex flex-col min-w-0 w-full"
          style={{ maxWidth: "min(460px, 100%)", gap: "clamp(20px, 2vw, 32px)", zIndex: 1 }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(16px, 1.5vw, 20px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
            }}
          >
            Reduce inherited risk and improve software composition analysis
            outcomes with hardened container foundations and contextualized
            insights.
          </p>
          <Link
            href="/contact-us"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "16px",
                fontWeight: 400,
              } as React.CSSProperties
            }
          >
            <span>Make SCA Actionable</span>
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

      {/* ══════════════════════════════════════════
          Mobile fallback (under md)
      ══════════════════════════════════════════ */}
      <div className="md:hidden relative h-full flex flex-col items-center justify-center gap-5 p-6 text-center">
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.1vw, 44px)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#ffffff",
          }}
        >
          From Findings to Action
        </p>
        <p
          style={{
            fontFamily: "var(--font-display)",
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            fontSize: "14px",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.8)",
            maxWidth: "320px",
          }}
        >
          Reduce inherited risk and improve SCA outcomes with hardened
          container foundations and contextualized insights.
        </p>
        <Link
          href="/contact-us"
          className="inline-flex items-center gap-2 rounded-[8px] overflow-hidden"
          style={{
            padding: "9px 18px",
            border: "1px solid #dab6f3",
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "#111",
              whiteSpace: "nowrap",
            }}
          >
            Make SCA Actionable
          </span>
          <svg
            aria-hidden
            role="presentation"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
