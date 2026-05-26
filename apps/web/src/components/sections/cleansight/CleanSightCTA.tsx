/*
 * Figma node 799:1339 — CleanSight CTA (white card variant)
 *
 *   Card bg: white (handled by the Footer's locked 1276×330 slot)
 *   Union SVG grid: 1101×1101 at left:547 top:-220 (decorative purple radial-grid)
 *   Ellipse top-left: 320×320 at left:-139 top:-168 (cyan glow)
 *   Ellipse bottom-right: 511×511 at left:1159 top:244 (purple glow)
 *   Screenshot mockup: 211×213, rotate(-15deg), at left:330 top:238
 *   Heading: 55px Figtree Bold, #111 — capped at 44px to match other CTAs
 *   Description: 21px Figtree Regular, #111 @ 80%
 *   Button: solid blue (#3960F9), white text, "Book a Container Scan"
 */

import Link from "next/link";

export function CleanSightCTA(): React.ReactElement {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* ── Decorative grid (Union SVG, radial-faded purple) ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
          opacity: 0.5,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Ellipse 46683 — top-left (Figma exact: #DF9BFF / 0.8 / blur 121.5) ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          zIndex: 2,
        }}
      />

      {/* ── Ellipse 46682 — bottom-right (Figma exact: #DF9BFF / 0.8 / blur 121.5) ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          zIndex: 1,
        }}
      />

      {/* ── Decorative pink/violet cube — bottom-left corner of the card ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.png"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "-40px",
          bottom: "-40px",
          width: "220px",
          height: "220px",
          objectFit: "contain",
          opacity: 0.5,
          zIndex: 3,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Content row — Vuln CTA pattern (absolute inset-0 + items-center) ── */}
      <div
        className="hidden md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0 absolute inset-0 items-start"
        style={{
          paddingLeft: "clamp(28px, 4vw, 64px)",
          paddingRight: "clamp(28px, 4vw, 64px)",
          paddingTop: "clamp(20px, 3vw, 32px)",
          paddingBottom: "clamp(20px, 3vw, 32px)",
          columnGap: "clamp(32px, 5vw, 72px)",
        }}
      >
        {/* Left: headline */}
        <p
          className="relative min-w-0 w-full font-display"
          style={{
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111111",
            maxWidth: "min(460px, 100%)",
            textWrap: "balance",
            margin: 0,
            zIndex: 2,
          }}
        >
          See Everything. Fix Everything.
        </p>

        {/* Right: description + CTA button */}
        <div
          className="flex flex-col min-w-0 w-full"
          style={{
            maxWidth: "420px",
            gap: "clamp(16px, 1.5vw, 24px)",
            zIndex: 2,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(17, 17, 17, 0.8)",
              margin: 0,
            }}
          >
            Continuous container visibility with integrated remediation across
            modern environments.
          </p>

          <Link
            href="/contact-us"
            className="cs-btn-blue self-start"
            style={
              {
                "--cs-btn-h": "44px",
                "--cs-btn-px": "16px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            <span>Book a Container Scan</span>
            <svg
              className="cs-cta-arrow ml-2"
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

      {/* ── Mobile layout (< md) — centered column with cube decoration ──
          The desktop content row above is `hidden md:flex`, so this is the
          only path that renders content inside the Footer's CTA slot at
          mobile widths. */}
      <div
        className="md:hidden absolute inset-0 overflow-hidden flex flex-col items-center justify-center text-center"
        style={{
          padding: "32px 28px",
        }}
      >
        {/* Purple cube — bottom-right corner decoration */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/vulnerability-remediation/cta-cube.png"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            right: "-24px",
            bottom: "-24px",
            width: "120px",
            height: "120px",
            objectFit: "contain",
            opacity: 0.85,
            zIndex: 1,
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Heading */}
        <p
          className="font-display"
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.15,
            color: "#111111",
            margin: 0,
            maxWidth: "300px",
            textWrap: "balance",
          }}
        >
          See Everything. Fix Everything.
        </p>

        {/* Subtitle */}
        <p
          style={{
            position: "relative",
            zIndex: 2,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            color: "rgba(17, 17, 17, 0.8)",
            margin: "12px 0 24px 0",
            maxWidth: "290px",
          }}
        >
          Continuous container visibility with integrated remediation across
          modern environments.
        </p>

        {/* Button — centered (not self-start like the desktop variant) */}
        <Link
          href="/contact-us"
          className="cs-btn-blue"
          style={
            {
              position: "relative",
              zIndex: 2,
              "--cs-btn-h": "44px",
              "--cs-btn-px": "20px",
              "--cs-btn-fs": "15px",
            } as React.CSSProperties
          }
        >
          <span>Book a Container Scan</span>
          <svg
            className="cs-cta-arrow ml-2"
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
  );
}
