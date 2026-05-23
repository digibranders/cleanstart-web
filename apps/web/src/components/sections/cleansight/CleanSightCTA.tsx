/*
 * Figma node 446:2377 — 1276×330 px card (positioned by Footer at top:-170px)
 *
 * Card background: linear-gradient(to bottom, #131e8f → #471ec0 at 111.05%)
 * Heading: 55px Figtree Bold, white, letter-spacing -0.05em, w=401px
 * Description: 21px, white 80% opacity, letter-spacing -0.04em, w=607px
 * Gap between columns: 68px; padding: 80px 100px
 * Button: glassmorphic — border #dab6f3, bg rgba(255,255,255,0.65), text #111
 * Union decoration: 1101×1101 at left=547, top=-220 (absolute within card)
 * Ellipse right: 511×511 at left=1159, top=244, blur soft radial
 * Ellipse left: 320×320 at left=-139, top=-168, blur soft radial
 */

import Link from "next/link";

export function CleanSightCTA(): React.ReactElement {
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
        className="pointer-events-none select-none absolute hidden lg:block"
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

      {/* ── Purple glow — bottom-right behind cube ── */}
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

      {/* ── Cube decoration — overflows bottom-right corner at 80% opacity (matches CISO/SBOM CTA) ── */}
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

      {/* ── Content row ── */}
      <div
        className="relative flex flex-col lg:flex-row lg:items-center"
        style={{
          padding: "clamp(40px, 6vw, 80px) clamp(32px, 5vw, 80px)",
          gap: "clamp(32px, 5vw, 72px)",
        }}
      >
        {/* Left: headline — auto-wraps 2 or 3 lines via balance */}
        <p
          className="relative text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.1vw, 44px)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "min(460px, 100%)",
            textWrap: "balance",
            zIndex: 1,
          }}
        >
          See Everything. Fix Everything.
        </p>

        {/* Right: description + CTA button */}
        <div className="relative flex flex-col" style={{ maxWidth: "min(460px, 100%)", gap: "clamp(20px, 2vw, 32px)", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(16px, 1.5vw, 20px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: "607px",
            }}
          >
            Continuous container visibility with integrated remediation across
            modern environments.
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
            <span>Book a Container Scan</span>
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
