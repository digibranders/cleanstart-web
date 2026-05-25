import Link from "next/link";

/**
 * Figma node 787:1918 — FIPS hero banner.
 * Confirmed frame size: 1440 × 667 px.
 *
 * All raw Figma pixel values are from the 1440px-wide frame.
 * Left positions inside the 1276px content container:
 *   container starts at x = (1440 - 1276) / 2 = 82px from frame left.
 *
 *   Text block (787:1948): x=82   y=186  w=623
 *     • h1   80px  ls=-4px (−0.05em)  lh=1.05
 *     • body 30px  ls=-1.2px (−0.04em)  lh=1.4  opacity=0.8
 *     • CTA  px=18 py=9, glass style
 *   Shield (787:1959):       center-x=1042  y=159  w=400  h=435
 *   Glow ellipse (787:1919): x=826          y=149  w=497  h=502
 *   Light-ray vector (787:1958): x=653      y=53   w=730  h=708
 *
 * vw rates (value / 1440 * 100):
 *   paddingTop  186 / 1440 = 12.92vw
 *   h1 font     80  / 1440 =  5.56vw
 *   body font   30  / 1440 =  2.08vw
 *   minHeight   667 / 1440 = 46.32vw
 */
export function FipsHero(): React.ReactElement {
  return (
    <section
      data-section="FipsHero"
      className="relative overflow-hidden bg-cs-hero"
      /* Figma frame height: 667px at 1440px viewport → 46.32vw */
      style={{ minHeight: "clamp(500px, 46.32vw, 667px)" }}
    >
      {/*
       * Bottom fade — blends the purple hero into the white section below.
       * Figma shows the last ~150px fading to white.
       */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: "200px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)",
        }}
      />

      {/*
       * Content container — max 1276px, centred.
       * At 1440px viewport: left margin = (1440−1276)/2 = 82px, matching the
       * Figma text block x=82px.  px-4 gives a 16px minimum edge-gap on
       * small screens (<1276px) where the container fills the viewport.
       */}
      <div
        className="relative mx-auto z-[2] px-4 md:px-0"
        style={{
          maxWidth: "1276px",
          /*
           * Figma: text block y=186px at 1440px → 186/1440 = 12.92vw.
           * No upper cap — let it scale naturally above 1440px.
           * Min 80px ensures text always clears the fixed navbar.
           */
          paddingTop: "clamp(80px, 12.92vw, 200px)",
          paddingBottom: "0",
          /* Mirror the confirmed Figma frame height */
          minHeight: "clamp(500px, 46.32vw, 667px)",
        }}
      >
        {/* ── Decorative layer: light-ray vector ── */}
        {/*
         * 787:1958 — w=730 h=708, Figma: x=653 y=53
         * In container: left=(653−82)/1276 ≈ 44.75%   top=53px
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/shield-glow.png"
          alt=""
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "44.75%",
            top: "53px",
            width: "57.21%", /* 730/1276 */
            height: "auto",
            mixBlendMode: "screen",
            opacity: 0.85,
          }}
          loading="eager"
          decoding="async"
        />

        {/* ── Decorative layer: purple radial glow ── */}
        {/*
         * 787:1919 — w=497 h=502, Figma: x=826 y=149
         * In container: left=(826−82)/1276 ≈ 58.31%   top=149px
         */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "58.31%",
            top: "149px",
            width: "38.95%", /* 497/1276 */
            aspectRatio: "497 / 502",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(118, 62, 255, 0.55) 0%, rgba(118, 62, 255, 0) 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* ── Shield image ── */}
        {/*
         * 787:1959 — w=400 h=435, Figma: center-x=1042 y=159
         *   left edge = 1042−200 = 842px; in container: (842−82)/1276 ≈ 59.56%
         *   top = 159px — shield top sits 27px ABOVE text block (y=186)
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/shield-only.png"
          alt=""
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "59.56%",
            top: "159px",
            width: "31.35%", /* 400/1276 */
            height: "auto",
          }}
          loading="eager"
          decoding="async"
        />

        {/* ── Left column: text content ── */}
        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "623px" }}
        >
          <h1
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              /*
               * Figma: 80px at 1440px → 80/1440 = 5.56vw
               */
              fontSize: "clamp(40px, 5.56vw, 80px)",
              fontWeight: 700,
              /* Figma: −4px on 80px = −0.05em */
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              marginBottom: "32px",
            }}
          >
            FIPS-Validated. Always{" "}
            <span className="cs-text-gradient-impact">Verified.</span>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              /*
               * Figma: 30px at 1440px → 30/1440 = 2.08vw
               */
              fontSize: "clamp(18px, 2.08vw, 30px)",
              fontWeight: 400,
              /* Figma: −1.2px on 30px = −0.04em */
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              /* Figma: opacity 0.8 */
              color: "rgba(255,255,255,0.8)",
              /* Figma paragraph fills the full 623px text column (min-w-full) */
              width: "100%",
              marginBottom: "32px",
            }}
          >
            Built on validated cryptographic foundations for secure, compliant
            container environments
          </p>

          {/* Mobile-only badge — between paragraph and CTA */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/fips/shield-only.png"
            alt=""
            className="pointer-events-none select-none md:hidden"
            style={{
              width: "220px",
              height: "auto",
              marginBottom: "32px",
            }}
            loading="eager"
            decoding="async"
          />

          <Link
            href="/cleanstart-images"
            className="cs-btn-glass"
            style={
              {
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            Explore FIPS Images
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
      </div>
    </section>
  );
}
