import Link from "next/link";

/**
 * Figma frame 1:637 — CTA card 1276 × 335.
 *
 * Layout (local card coords, exact Figma pixels):
 *   Heading (1:639)      left=122  top=85    w=401  h=165   (3 lines)
 *   Body (1:641)         left=638  top=90.5  w=493  h=87    (3 lines)
 *   Button (1:642)       left=638  top=201.5 w=177  h=43    "Get a Demo"
 *   Cube (1:651)         left=1054 top=167   w=255  h=258
 *                        (visible 222×168 after card overflow-hidden clips
 *                         the 33px hanging past the right edge)
 *
 * Card background — sampled directly from the Figma render at three Y bands:
 *   y=0  →  #131E8F   (deep navy at top)
 *   y=167 → #2A1EA5   (mid)
 *   y=335 → #401EBA   (purple at bottom)
 * The cube image (cta-cube.png) has the SAME vertical gradient baked into
 * its non-cube pixels, so once the card uses this exact gradient the cube
 * blends seamlessly with no visible bounding-box edges.
 *
 * Footer overlap (per CLAUDE.md "CTA ↔ Footer overlap pattern"):
 *   - mb-[-160px] on the <section> pulls the following <Footer /> up by 160px.
 *   - Section has NO solid bg — the parent FadeUp wrapper is z-10 and the
 *     framer-motion transform creates a stacking context, so any solid bg
 *     on the section would paint *above* the dark footer in the overlap
 *     zone. With no section bg, the footer's dark gradient fills the overlap
 *     zone cleanly. The body's default white bg covers everything above the
 *     section so the page above stays white as expected.
 *   - z-20 on the inner card wrapper so the card paints above both the
 *     footer and the prior FadeUp wrappers.
 */
const W = 1276;
const H = 335;
const pctX = (px: number): string => `${(px / W) * 100}%`;
const pctY = (px: number): string => `${(px / H) * 100}%`;

const CARD_BG =
  "linear-gradient(180deg, #131E8F 0%, #2A1EA5 50%, #401EBA 100%)";

export function FipsCTA(): React.ReactElement {
  return (
    <section
      data-section="FipsCTA"
      className="relative px-4 sm:px-6"
      style={{ marginBottom: "-160px" }}
    >
      <div className="relative mx-auto z-20" style={{ maxWidth: `${W}px` }}>
        {/* CTA card — exact Figma aspect ratio + matching vertical gradient. */}
        <div
          className="relative overflow-hidden hidden md:block"
          style={{
            aspectRatio: `${W} / ${H}`,
            borderRadius: "32px",
            background: CARD_BG,
            boxShadow:
              "0 24px 60px -20px rgba(40, 30, 200, 0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          {/* Cube — anchored to bottom-right at exact Figma size. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/fips/cta-cube.png"
            alt=""
            className="pointer-events-none select-none absolute"
            style={{
              right: 0,
              bottom: 0,
              width: pctX(222), // 17.40% — exact Figma visible width
              height: "auto",
            }}
            loading="lazy"
            decoding="async"
          />

          {/* Heading — absolute at exact Figma coords. */}
          <h2
            className="text-white absolute"
            style={{
              left: pctX(122),
              top: pctY(85),
              width: pctX(401),
              fontFamily: "var(--font-figtree)",
              fontSize: "clamp(26px, 2.71vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Ready to Secure Your Container Infrastructure?
          </h2>

          {/* Body text — absolute. */}
          <p
            className="absolute"
            style={{
              left: pctX(638),
              top: pctY(90),
              width: pctX(493),
              fontFamily: "var(--font-figtree)",
              fontSize: "clamp(14px, 1.15vw, 22px)",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.88)",
              margin: 0,
            }}
          >
            Start with zero-CVE hardened images. Deploy faster with confidence
            knowing your containers are secured from the ground up.
          </p>

          {/* Button — absolute at Figma button position. */}
          <Link
            href="/contact-us"
            className="cs-btn-glass absolute"
            style={
              {
                left: pctX(638),
                top: pctY(201),
                "--cs-btn-h": "43px",
                "--cs-btn-px": "30px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            Get a Demo
            <svg
              className="cs-cta-arrow"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 11h14M12 5l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {/* -------------------- Mobile fallback -------------------- */}
        <div
          className="md:hidden relative overflow-hidden p-6 flex flex-col gap-5"
          style={{
            borderRadius: "24px",
            background: CARD_BG,
            minHeight: "320px",
          }}
        >
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-figtree)",
              fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "280px",
            }}
          >
            Ready to Secure Your Container Infrastructure?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-figtree)",
              fontSize: "14px",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            Start with zero-CVE hardened images. Deploy faster with confidence
            knowing your containers are secured from the ground up.
          </p>
          <Link
            href="/contact-us"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-h": "40px",
                "--cs-btn-px": "22px",
                "--cs-btn-fs": "14px",
              } as React.CSSProperties
            }
          >
            Get a Demo
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
