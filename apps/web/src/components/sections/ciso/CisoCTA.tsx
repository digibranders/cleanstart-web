/*
 * Figma node 583:2388 — 1276×330 px card (positioned by Footer at top:-170px)
 *
 * Card background: linear-gradient(to bottom, #131e8f → #471ec0 at 111.05%)
 * Heading: 55px Manrope Bold, white, letter-spacing -0.05em, w=520px
 * Description: 21px Sora, white 80% opacity, letter-spacing -0.04em, w=500px
 * Gap between columns: 68px; padding: 80px 100px
 * Button: glassmorphic — border #dab6f3, bg rgba(255,255,255,0.65), text #111
 * Cube decoration: cta-cube.png, 380×380, right side of card
 * Ellipse glow left: 320×320 at left=-139, top=-168
 */

import Link from "next/link";

export function CisoCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)",
      }}
    >
      {/* Cyan glow — top-left */}
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

      {/* Purple glow — right (subtle, behind cube) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: "0",
          bottom: "-80px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(154, 81, 255, 0.2)",
          filter: "blur(80px)",
        }}
      />

      {/* Cube decoration — overflows bottom-right corner at 80% opacity */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/cta-cube-noise.png"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          right: "-60px",
          bottom: "-100px",
          width: "300px",
          height: "300px",
          objectFit: "contain",
          opacity: 0.75,
          zIndex: 0,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Content row.
          Top padding pulled in (80 → 56) and title column widened (401 → 560)
          so the long "Strengthen Your Software Supply Chain Foundations"
          headline wraps into 3 lines instead of 5 and stays vertically
          centered within the 330 px CTA card slot. */}
      <div
        className="relative flex flex-col lg:flex-row lg:items-start"
        style={{ padding: "clamp(40px, 6vw, 64px) clamp(32px, 5vw, 80px)", gap: "clamp(32px, 5vw, 72px)" }}
      >
        {/* Left: headline — auto-wraps 2 or 3 lines via balance */}
        <p
          className="relative text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "min(460px, 100%)",
            textWrap: "balance",
            zIndex: 1,
          }}
        >
          Strengthen Your Software Supply Chain Foundations
        </p>

        {/* Right: description + CTA */}
        <div className="relative flex flex-col" style={{ maxWidth: "min(460px, 100%)", gap: "clamp(20px, 2vw, 32px)", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: "500px",
            }}
          >
            Get the executive brief on how minimal, hardened container foundations
            reduce inherited risk across your entire software supply chain.
          </p>

          <Link
            href="/contact-us"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "16px",
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
