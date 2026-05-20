import Image from "next/image";
import Link from "next/link";

/**
 * Inner content for the SBOM CTA card, rendered inside the Footer's
 * fixed 1276 × 330 / radius-40 slot.
 *
 * Figma node 161:21812 — card 1276 × 375px (bottom 45px clipped by slot).
 * Background: #131E8F → #471EC0 diagonal gradient.
 * Bird sits at left-[308px] top-[221.5px], partially clipped at bottom.
 */

const CARD_BG = "linear-gradient(105deg, #131E8F 0%, #471EC0 100%)";

export function SbomCTA(): React.ReactElement {
  return (
    <div
      data-section="SbomCTA"
      className="absolute inset-0 overflow-hidden"
      style={{ background: CARD_BG }}
    >
      {/* Decorative glow — right edge */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.50) 0%, rgba(154,81,255,0) 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Decorative glow — left edge */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.35) 0%, rgba(44,193,235,0) 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* ── Desktop layout (md+) ── */}
      <div
        className="hidden md:flex absolute inset-0 items-start"
        style={{
          paddingLeft: "100px",
          paddingRight: "100px",
          paddingTop: "80px",
          gap: "68px",
        }}
      >
        {/* Left column — heading, 401px wide */}
        <div className="relative" style={{ width: "401px", flexShrink: 0 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "55px",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              color: "#fff",
              margin: 0,
            }}
          >
            See Everything. Trust Every Component.
          </h2>
        </div>

        {/* Right column — body + button, 607px wide */}
        <div
          className="flex flex-col"
          style={{ width: "607px", gap: "32px", flexShrink: 0 }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "21px",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.80)",
              margin: 0,
            }}
          >
            Generate signed, complete SBOMs automatically on every build.
            Meet EO 14028, EU CRA, and FIPS requirements without the manual
            overhead.
          </p>
          <Link
            href="/contact-us"
            className="cs-btn-glass self-start"
            style={
              {
                "--cs-btn-h": "var(--btn-h-xl)",
                "--cs-btn-px": "32px",
                "--cs-btn-fs": "17px",
              } as React.CSSProperties
            }
          >
            Contact us
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

      {/* Bird — absolute, bottom-left of card, partially clipped by slot */}
      <Image
        src="/images/sbom/cta-bird.png"
        alt=""
        aria-hidden
        width={304}
        height={206}
        sizes="304px"
        className="hidden md:block absolute pointer-events-none select-none object-contain"
        style={{ left: "308px", top: "221.5px", width: "304px", height: "206px" }}
        loading="lazy"
      />

      {/* ── Mobile fallback ── */}
      <div className="md:hidden relative h-full px-6 py-10 flex flex-col gap-5 justify-center">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(24px, 6vw, 36px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#fff",
            maxWidth: "280px",
          }}
        >
          See Everything. Trust Every Component.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "14px",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.80)",
          }}
        >
          Generate signed, complete SBOMs automatically on every build.
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
          Contact us
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
