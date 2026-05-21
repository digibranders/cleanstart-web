import Link from "next/link";

/**
 * Inner content for the SBOM CTA card, rendered inside the Footer's
 * fixed 1276 × 330 / radius-40 slot.
 *
 * Figma node 161:21812 — card 1276 × 375px (bottom 45px clipped by slot).
 * Background: #131E8F → #471EC0 diagonal gradient.
 * Bird sits at left-[308px] top-[221.5px], partially clipped at bottom.
 */

const CARD_BG = "linear-gradient(180deg, #131E8F 0%, #471EC0 100%)";

export function SbomCTA(): React.ReactElement {
  return (
    <div
      data-section="SbomCTA"
      className="absolute inset-0 overflow-hidden"
      style={{ background: CARD_BG }}
    >
      {/* ── SVG grid union (radial gradient pattern) ── */}
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
          opacity: 0.08,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* ── Ellipse — top-left ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* ── Ellipse — bottom-right ── */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />

      {/* ── Desktop layout (md+) — vertical stack until lg, then 2-col ── */}
      <div
        className="hidden md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0 absolute inset-0 items-start"
        style={{
          paddingLeft: "clamp(32px, 5vw, 100px)",
          paddingRight: "clamp(32px, 5vw, 100px)",
          paddingTop: "clamp(40px, 5vw, 80px)",
          columnGap: "clamp(24px, 4vw, 68px)",
        }}
      >
        {/* Left column — heading, up to 401px wide, shrinks on narrow viewports */}
        <div className="relative lg:flex-1 min-w-0 w-full" style={{ maxWidth: "401px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              color: "#fff",
              margin: 0,
            }}
          >
            Verify Every Component You Ship
          </h2>
        </div>

        {/* Right column — body + button, up to 607px wide, shrinks on narrow viewports */}
        <div
          className="flex flex-col lg:flex-1 min-w-0 w-full"
          style={{ maxWidth: "607px", gap: "clamp(20px, 2vw, 32px)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(15px, 1.15vw, 22px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.80)",
              margin: 0,
            }}
          >
            Continuously updated, cryptographically verifiable software
            inventories built for modern software supply chains.
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
            Download the SBOM Datasheet
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

      {/* Cube decoration — overflows bottom-right corner at 80% opacity (matches CISO CTA) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/cta-cube-noise.png"
        alt=""
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          right: "-60px",
          bottom: "-100px",
          width: "300px",
          height: "300px",
          objectFit: "contain",
          opacity: 0.8,
          zIndex: 0,
        }}
        loading="lazy"
        decoding="async"
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
          Verify Every Component You Ship
        </h2>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(13px, 1vw, 15px)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.80)",
          }}
        >
          Continuously updated, cryptographically verifiable software
          inventories built for modern software supply chains.
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
          Download the SBOM Datasheet
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
