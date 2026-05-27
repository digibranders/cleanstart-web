import Link from "next/link";

/**
 * Inner content for the FIPS CTA card (Figma node 787:2343).
 * Card natural size: 1276 × 335 px, border-radius 40px.
 *
 * Figma layout (inside 1276×335 slot, all measurements relative to card width):
 *   Content container: left=122px (9.56%), width=1047px (82.05%)
 *     vertically centred (top=85px = ~25% of 335px → use flex items-center)
 *     gap=115px (11.00% of 1047px content container)
 *   Heading col : 401px = 38.30% of content container
 *     55px Manrope Bold  ls=−0.05em  lh=1  white
 *   Right col   : 493px = 47.09% of content container
 *     flex-col gap=24px
 *     – body  : 21px Regular  ls=−0.04em  lh=1.4  opacity=0.8
 *     – button: cs-btn-glass 18px px=18px
 *   Cube image  : absolute bottom-right, w=255px = 19.98% of card width
 *
 * vw rates (value / 1440 × 100):
 *   heading font  55 / 1440 = 3.82vw
 *   body font     21 / 1440 = 1.46vw
 *
 * Using absolute inner container to pin left=9.56% and span 82.05% width
 * avoids percentage-of-content-box drift that occurs with CSS padding.
 */

const CARD_BG =
  "linear-gradient(180deg, #131E8F 0%, #2A1EA5 50%, #401EBA 100%)";

export function FipsCTA(): React.ReactElement {
  return (
    <div
      data-section="FipsCTA"
      className="absolute inset-0 overflow-hidden"
      style={{ background: CARD_BG }}
    >
      {/* ── Cube — anchored bottom-right ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/cta-cube.png"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: 0,
          bottom: 0,
          /* Figma: 255px at 1276px card width → 19.98% */
          width: "19.98%",
          height: "auto",
          opacity: 0.75,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Desktop layout (md+) ── */}
      {/*
       * Absolutely-positioned inner container that maps directly to Figma coords:
       *   left  = 122 / 1276 = 9.56% of card width
       *   width = 1047 / 1276 = 82.05% of card width
       *   top/bottom = 0 → vertically centred via flex items-center
       */}
      <div
        className="hidden md:flex absolute items-center"
        style={{
          left: "9.56%",
          width: "82.05%",
          top: 0,
          bottom: 0,
          /* gap = 115px at 1047px container = 10.98%, clamped */
          gap: "clamp(32px, 10.98%, 115px)",
        }}
      >
        {/* Heading — 401 / 1047 = 38.30% of content container */}
        <p
          className="text-white flex-shrink-0"
          style={{
            fontFamily: "var(--font-display)",
            // Global CTA-card title token (`--cta-card-title`) per strict-fonts rule.
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            width: "38.30%",
          }}
        >
          Ready to Secure Your Container Infrastructure?
        </p>

        {/* Right column — 493 / 1047 = 47.09% of content container */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{ gap: "24px", width: "47.09%" }}
        >
          {/* Body — 21px Regular, ls=−0.04em, lh=1.4, opacity=0.8 */}
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.80)",
            }}
          >
            Start with zero-CVE hardened images. Deploy faster with confidence
            knowing your containers are secured from the ground up.
          </p>

          {/* Button — 18px font, px=18px (Figma node 787:2348) */}
          <Link
            href="/book-a-demo"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-px": "18px",
                "--cs-btn-fs": "18px",
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
      </div>

      {/* ── Mobile fallback (under md) ── */}
      <div className="md:hidden relative h-full p-6 flex flex-col gap-5 justify-center items-center text-center">
        <p
          className="text-white"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "280px",
          }}
        >
          Ready to Secure Your Container Infrastructure?
        </p>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.80)",
          }}
        >
          Start with zero-CVE hardened images. Deploy faster with confidence
          knowing your containers are secured from the ground up.
        </p>
        <Link
          href="/book-a-demo"
          className="cs-btn-glass self-center"
          style={
            {
              "--cs-btn-px": "18px",
              "--cs-btn-fs": "16px",
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
  );
}
