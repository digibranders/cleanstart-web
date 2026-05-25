import Link from "next/link";

/**
 * Figma node 787:1918 — FIPS hero banner (desktop 1440 × 667 px).
 * Figma node 913:219  — FIPS hero banner (mobile  360  × 658 px).
 *
 * Desktop layout (all values from 1440px-wide frame):
 *   Container starts at x = (1440−1276)/2 = 82px from frame left.
 *   Text block (787:1948): x=82  y=186  w=623
 *     • h1   80px  ls=−0.05em  lh=1.05
 *     • body 30px  ls=−0.04em  lh=1.4  opacity=0.8
 *     • CTA  px=18 py=9, glass style
 *   Shield (787:1959):        center-x=1042  y=159  w=400  h=435
 *   Glow ellipse (787:1919):  x=826          y=149  w=497  h=502
 *   Light-ray vector (787:1958): x=653       y=53   w=730  h=708
 *
 * Mobile layout (all values from 360px-wide frame, node 913:219):
 *   Frame height: 658px
 *   Content block (366:7875): centered, w=312px, top=136px
 *     • h1   32px  ls=−0.05em  lh=1.2  white (centered)
 *     • body 16px  ls=−0.04em  lh=1.4  opacity=0.8 (centered)
 *     • CTA  "Explore FIPS Images", px=24 py=12 (comes BEFORE shield)
 *   Purple glow blob (366:7912): absolute, centered, top=336px, h=303px
 *   Shield (366:7915): absolute, centered, top=376px, w=200px, h=218px
 *
 * vw rates (value / 1440 × 100):
 *   paddingTop  186 / 1440 = 12.92vw
 *   h1 font      80 / 1440 =  5.56vw
 *   body font    30 / 1440 =  2.08vw
 *   minHeight   667 / 1440 = 46.32vw
 */
export function FipsHero(): React.ReactElement {
  return (
    <section
      data-section="FipsHero"
      className="relative overflow-hidden bg-cs-hero"
      /*
       * Desktop: 667px at 1440px → 46.32vw, min 500px
       * Mobile (Figma 913:219): frame is 658px tall — raise mobile min to 658px
       */
      style={{ minHeight: "clamp(658px, 46.32vw, 667px)" }}
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
       * Mobile-only purple radial glow behind the shield (Figma 366:7912).
       * Figma: absolute, left=24px, top=336px, w=312px, h=303px.
       * Approximated as a centered radial gradient at the bottom of the section.
       */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute md:hidden"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          top: "336px",
          width: "360px",
          height: "320px",
          background:
            "radial-gradient(ellipse at center, rgba(118, 62, 255, 0.70) 0%, rgba(90, 30, 200, 0.45) 35%, rgba(60, 10, 140, 0) 75%)",
          filter: "blur(8px)",
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
           * Desktop: text block y=186px at 1440px → 12.92vw, min 80px.
           * Mobile (Figma 913:219): content block top=136px. Nav is ~56px
           * with 8px safe area → paddingTop 136px on mobile.
           */
          paddingTop: "clamp(136px, 12.92vw, 200px)",
          paddingBottom: "0",
          /* Desktop min-height mirrors Figma frame */
          minHeight: "clamp(658px, 46.32vw, 667px)",
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
        {/*
         * Mobile (Figma 913:219): centered column, w=312px, items-center.
         * Order: h1 → body → CTA button → (shield rendered below outside this col).
         * Desktop: left-aligned, max-w=623px.
         */}
        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "623px" }}
        >
          <h1
            className="text-white leading-[1.2] md:leading-[1.05]"
            style={{
              fontFamily: "var(--font-display)",
              /*
               * Mobile (Figma 913:219): 32px, lh=1.2 (via Tailwind leading-[1.2])
               * Desktop (Figma 787:1918): 80px at 1440px → 5.56vw, lh=1.05 (md:leading-[1.05])
               */
              fontSize: "clamp(32px, 5.56vw, 80px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              marginBottom: "clamp(16px, 1.67vw, 24px)",
            }}
          >
            FIPS-Validated. Always{" "}
            <span className="cs-text-gradient-impact">Verified.</span>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              /*
               * Mobile (Figma 913:219): 16px, ls=−0.04em, lh=1.4
               * Desktop (Figma 787:1918): 30px at 1440px → 2.08vw
               */
              fontSize: "clamp(16px, 2.08vw, 30px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.8)",
              width: "100%",
              marginBottom: "clamp(24px, 2.22vw, 32px)",
            }}
          >
            Built on validated cryptographic foundations for secure, compliant
            container environments
          </p>

          {/*
           * CTA button — appears BEFORE the shield on mobile (Figma 913:219 layout).
           * Mobile: px=24 py=12 (Figma 366:7880: px-[24px] py-[12px])
           * Desktop: px=18 py=9 (Figma 787:1948)
           */}
          <Link
            href="/cleanstart-images"
            className="cs-btn-glass"
            style={
              {
                "--cs-btn-px": "24px",
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

        {/*
         * Mobile-only shield badge — rendered BELOW the CTA block.
         * Figma 913:219 (366:7915): w=200px, h=218px, centered, top=376px.
         * In flow: appears after the text column; natural spacing pushed by
         * the text block height (~200px) + paddingTop (136px) ≈ 336px,
         * then marginTop=40px pushes it to ~376px from section top.
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/shield-only.png"
          alt=""
          className="pointer-events-none select-none md:hidden mx-auto block relative z-[2]"
          style={{
            width: "200px",
            height: "auto",
            marginTop: "40px",
          }}
          loading="eager"
          decoding="async"
        />
      </div>
    </section>
  );
}
