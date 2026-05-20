import type React from "react";
import Link from "next/link";

/**
 * SCA CTA — Figma node 604:3631 (1276×335 px card in Footer slot)
 *
 * Layout: everything centred — heading + description + button in a 571px
 * column, horizontally & vertically centred inside the card.
 * 3D teal cube peeks from the bottom-right corner (clips via parent overflow:hidden).
 *
 * Background: linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)
 * Heading:    55px Figtree Bold, white, letter-spacing -0.05em
 * Body:       21px regular, white 80%, centre-aligned, letter-spacing -0.04em
 * Button:     "Make SCA Actionable" — glass: border #dab6f3, bg white 65%
 * Cube:       absolute at left:84.81% top:58.07%, overflows right/bottom edges
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
        src="/images/sca/cta-cube.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "84.81%",
          top: "58.07%",
          right: "-1.32%",
          bottom: "-16.2%",
          width: "auto",
          height: "auto",
          maxWidth: "none",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ══════════════════════════════════════════
          Desktop layout (md+) — centred content block
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center">
        <div
          style={{
            width: "min(571px, 85%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "32px",
          }}
        >
          {/* Heading + description */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "19px",
              width: "100%",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 2.86vw, 55px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                color: "#ffffff",
                textAlign: "center",
                margin: 0,
              }}
            >
              From Findings to Action
            </h2>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(14px, 1.09vw, 21px)",
                fontWeight: 400,
                letterSpacing: "-0.04em",
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.8)",
                textAlign: "center",
                margin: 0,
              }}
            >
              Reduce inherited risk and improve software composition analysis
              outcomes with hardened container foundations and contextualized
              insights.
            </p>
          </div>

          {/* CTA button */}
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
                fontSize: "clamp(14px, 0.94vw, 18px)",
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
              width="18"
              height="18"
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

      {/* ══════════════════════════════════════════
          Mobile fallback (under md)
      ══════════════════════════════════════════ */}
      <div className="md:hidden relative h-full flex flex-col items-center justify-center gap-5 p-6 text-center">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 7vw, 36px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#ffffff",
          }}
        >
          From Findings to Action
        </h2>
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
