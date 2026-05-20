import Link from "next/link";

/**
 * Figma frame 1:204 — 1920 × 741 hero (header included).
 *
 * Coords below are quoted in raw Figma pixels and converted to
 * percentages of the 1276-wide content container so the layout
 * scales proportionally below 1920w breakpoints.
 *
 *   Text frame:   x=322  y=186  w=623  h=346
 *     • h1        w=623  h=160
 *     • subhead   y=192  h=154
 *       - body    h=84
 *       - button  y=116  w=221  h=38
 *   Shield img:   x=1090 y=186  w=400  h=435
 *   Purple glow:  x=993  y=159  w=497  h=502  (Ellipse 1:205)
 *   Light rays:   x=899  y=70   w=730  h=708  (Vector  1:244)
 */
export function FipsHero(): React.ReactElement {
  return (
    <section
      data-section="FipsHero"
      className="relative overflow-hidden bg-cs-hero bg-cs-grid"
      style={{ minHeight: "clamp(560px, 51vw, 741px)" }}
    >
      {/*
       * Bottom fade — Figma renders the last ~14% of the hero (~104px @ 741h)
       * blurring from peak purple #461EC2 into pure white where the next
       * section (WhyMatters, bg-white) begins. Sampled stops at x=200:
       *   y=637 (86%) → #6c4ccc
       *   y=686 (93%) → #a998e0
       *   y=735 (99%) → #ffffff
       * We reproduce that with a 200px white-to-transparent overlay glued to
       * the section's bottom edge so the fade lives *inside* the hero and
       * naturally merges into the white WhyMatters section below.
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

      <div
        className="relative mx-auto z-[2]"
        style={{
          maxWidth: "1276px",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "clamp(110px, 13vw, 186px)",
          paddingBottom: "0",
          minHeight: "741px",
        }}
      >
        {/* --- Right column: glow + shield, absolute-positioned at Figma coords. --- */}
        {/* Light-ray vector behind shield (1:244 — w=730 h=708, top:-30 from y=70-100 hero) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/shield-glow.png"
          alt=""
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            // x=899 in frame → content-x=577; left:577/1276*100% ≈ 45.22%
            left: "45.22%",
            // y=70 from frame top; hero padding-top is 0 at section
            top: "70px",
            width: "57.21%", // 730/1276
            height: "auto",
            mixBlendMode: "screen",
            opacity: 0.85,
          }}
          loading="eager"
          decoding="async"
        />

        {/* Purple radial glow (1:205 — ellipse 497×502 at x=993 y=159) */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "52.59%", // 671/1276
            top: "159px",
            width: "38.95%", // 497/1276
            aspectRatio: "497 / 502",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(118, 62, 255, 0.55) 0%, rgba(118, 62, 255, 0) 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Shield image (1:245 — image 583136, 400×435 at x=1090 y=186).
            shield-only.png is the contentsOnly export — has transparent
            outside the shield silhouette so its own dark inner halo blends
            into the hero gradient without a visible bounding rectangle. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/shield-only.png"
          alt=""
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "60.19%", // 768/1276
            top: "186px",
            width: "31.35%", // 400/1276
            height: "auto",
          }}
          loading="eager"
          decoding="async"
        />

        {/* --- Left column: text content (623 wide × 346 tall). --- */}
        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "623px" }}
        >
          <h1
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              // Figma h1 is 80px at 1920w. clamp scales down to 40px on mobile.
              fontSize: "clamp(40px, 4.16vw, 80px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1.0,
              marginBottom: "32px", // gap between h1 (h=160) and subhead frame (y=192) = 32
            }}
          >
            FIPS-Validated. Always{" "}
            <span
              style={{
                background:
                  "linear-gradient(95deg, #82AEFF 0%, #2CC1EB 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Verified.
            </span>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(15px, 1.35vw, 26px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.85)",
              maxWidth: "545px",
              marginBottom: "32px", // gap between body (h=84) and button (y=116) = 32
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
                // Figma button: w=221, h=38 -> raised to 44 (WCAG 2.5.8); padding 18, font 16/20
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
