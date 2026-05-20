import Link from "next/link";

/**
 * Inner content for the FIPS Compliance CTA, rendered inside the Footer's
 * fixed 1276 × 330 / radius-40 slot. Figma frame 1:637.
 *
 * Card background — sampled directly from the Figma render at three Y bands:
 *   y=0   → #131E8F (deep navy at top)
 *   y=167 → #2A1EA5 (mid)
 *   y=335 → #401EBA (purple at bottom)
 * The cube image (cta-cube.png) has the SAME vertical gradient baked into
 * its non-cube pixels so it blends seamlessly with no visible bounding box.
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
      {/* -------------------- Desktop layout (md+) -------------------- */}
      <div className="hidden md:block absolute inset-0">
        {/* Cube — anchored to bottom-right. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/fips/cta-cube.png"
          alt=""
          className="pointer-events-none select-none absolute"
          style={{
            right: 0,
            bottom: 0,
            width: "17.40%",
            height: "auto",
          }}
          loading="lazy"
          decoding="async"
        />

        {/* Heading — absolute at exact Figma coords (1276×330 slot). */}
        <h2
          className="font-display text-white absolute"
          style={{
            left: "9.56%",
            top: "25.76%",
            width: "31.43%",
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
          className="font-display absolute"
          style={{
            left: "50.00%",
            top: "27.27%",
            width: "38.64%",
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
              left: "50.00%",
              top: "60.91%",
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

      {/* -------------------- Mobile fallback (under md) -------------------- */}
      <div className="md:hidden relative h-full p-6 flex flex-col gap-5 justify-center">
        <h2
          className="font-display text-white"
          style={{
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
          className="font-display"
          style={{
            fontSize: "clamp(13px, 1vw, 15px)",
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
  );
}
