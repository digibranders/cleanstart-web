import Link from "next/link";

/**
 * Figma frame 161:20839 — 1920 × 652 SBOM hero (header included).
 *
 * Layout:
 *   Text frame: x=649 y=186  w=623 h=304 (centered in 1920 frame)
 *     • h1       h=160  "Software Bill of Materials"
 *     • subhead  y=192  "Know What you Ship. Verify Component"
 *     • button   y=266  "Learn More"
 *   Light-ray vector: x=603 y=0 w=730 h=708 (decorative, extends below hero)
 *   Grid bg: full width, 568px tall (rows of rounded squares)
 *
 * Background gradient: navy → deep-blue → purple (same token as .bg-cs-hero).
 * The grid overlay uses .bg-cs-grid for the horizontal/vertical line texture.
 */
export function SbomHero(): React.ReactElement {
  return (
    <section
      data-section="SbomHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{ minHeight: "clamp(480px, 40vw, 652px)" }}
    >
      {/* SVG grid overlay — Figma Vector 730×708 centered at top, radial fade
          (white → #DBD8E0 transparent), opacity 0.15 baked into the SVG path.
          Replaces the section-wide .bg-cs-grid CSS line pattern. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2 hidden md:block"
        style={{ top: 0, width: "730px", maxWidth: "100%", aspectRatio: "730 / 708" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/newsroom/hero-grid.svg"
          alt=""
          loading="eager"
          decoding="async"
          className="w-full h-full"
        />
      </div>

      {/* Light-ray decorative vector (x=603 of 1920 ≈ 31.4%, y=0, w=730/1920=38%) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/hero-rays.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "31.4%",
          top: 0,
          width: "38%",
          height: "auto",
          mixBlendMode: "screen",
          opacity: 0.6,
        }}
        loading="eager"
        decoding="async"
      />

      {/* Bottom fade — blends the hero gradient into the white section below */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: "180px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.85) 85%, #ffffff 100%)",
        }}
      />

      {/* Content container — max-width 1276px centred, same as all other pages */}
      <div
        className="relative mx-auto z-[2] flex w-full max-w-[var(--container-default)] flex-col items-center px-6 sm:px-10 text-center"
        style={{
          paddingTop: "clamp(112px, 8vw, 128px)",
          paddingBottom: "clamp(40px, 5vw, 80px)",
        }}
      >
        <h1
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 4.45vw, 64px)",
            fontWeight: 600,
            letterSpacing: "var(--text-hero-product-ls, -0.04em)",
            lineHeight: "var(--text-hero-lh, 1.05)",
            marginBottom: "clamp(16px, 2.5vw, 32px)",
            maxWidth: "623px",
            textTransform: "capitalize",
          }}
        >
          Continuously Verifiable SBOMs
        </h1>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-t-subhead)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.80)",
            maxWidth: "623px",
            marginBottom: "clamp(24px, 2.5vw, 32px)",
          }}
        >
          Know what you ship with continuously updated, cryptographically verifiable software inventories.
        </p>

        <Link
          href="/book-a-demo"
          className="cs-btn-glass"
          style={
            {
              "--cs-btn-px": "18px",
              "--cs-btn-fs": "16px",
            } as React.CSSProperties
          }
        >
          Watch How SBOM Works
          <svg
            className="cs-cta-arrow"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
            <path
              d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
