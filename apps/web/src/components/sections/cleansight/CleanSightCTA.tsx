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
      {/* ── Union decoration — top-centre-right ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Purple glow — right ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "rgba(154, 81, 255, 0.18)",
          filter: "blur(100px)",
        }}
      />

      {/* ── Cyan glow — top-left ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
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

      {/* ── Content row ── */}
      <div
        className="relative flex flex-col lg:flex-row items-start"
        style={{
          padding: "80px 100px",
          gap: "68px",
        }}
      >
        {/* Left: headline */}
        <h2
          className="relative flex-shrink-0 text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 2.86vw, 55px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1.0,
            width: "min(401px, 100%)",
            zIndex: 1,
          }}
        >
          See Everything.{" "}
          <br />
          Fix Everything.
        </h2>

        {/* Right: description + CTA button */}
        <div className="relative flex flex-col flex-1" style={{ gap: "40px", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(14px, 1.09vw, 21px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: "607px",
            }}
          >
            Continuous container visibility with integrated remediation across
            modern environments.
          </p>

          {/* Glass button — Figma: border #dab6f3, bg white 65%, dark text */}
          <Link
            href="/contact-us"
            className="self-start inline-flex items-center gap-2 rounded-[8px] overflow-hidden"
            style={{
              padding: "9px 18px",
              border: "1px solid #dab6f3",
              background: "rgba(255, 255, 255, 0.65)",
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
              Book a Container Scan
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
    </div>
  );
}
