import Image from "next/image";

/**
 * Figma frame 161:21113 — 1920 × 1088 "When SBOMs Fall Short, Risk Grows"
 *
 * Desktop: White background section with a 2×2 grid of risk cards.
 * Mobile (Figma 817:1281): Stacked cards with circular glow icons and dark
 * card backgrounds from the 360px mobile design.
 */

const RISKS = [
  {
    id: "incomplete",
    icon: "/images/sbom/risk-icon-incomplete.png",
    mobileIcon: "/images/sbom/mobile-risk-1.png",
    iconAlt: "Incomplete Visibility icon",
    title: "Incomplete Visibility",
    body: "Missing packages and dependencies hide risk.",
  },
  {
    id: "traceability",
    icon: "/images/sbom/risk-icon-traceability.png",
    mobileIcon: "/images/sbom/mobile-risk-2.png",
    iconAlt: "Broken Traceability icon",
    title: "Broken Traceability",
    body: "Disconnected inventories weaken provenance tracking.",
  },
  {
    id: "stale",
    icon: "/images/sbom/risk-icon-stale.png",
    mobileIcon: "/images/sbom/mobile-risk-3.png",
    iconAlt: "Stale Data icon",
    title: "Stale Data",
    body: "Static SBOMs quickly become outdated.",
  },
  {
    id: "compliance",
    icon: "/images/sbom/risk-icon-compliance.png",
    mobileIcon: "/images/sbom/mobile-risk-4.png",
    iconAlt: "Compliance Exposure icon",
    title: "Compliance Exposure",
    body: "Incomplete inventories increase audit complexity.",
  },
] as const;

const vw = (n: number): string => `${(n / 1920) * 100}vw`;

export function SbomRisks(): React.ReactElement {
  return (
    <section
      data-section="SbomRisks"
      className="relative overflow-hidden bg-white"
      style={{ paddingTop: "clamp(56px, 8vw, 120px)", paddingBottom: "clamp(56px, 8vw, 120px)" }}
    >
      {/* Decorative radial halos — Figma 1920 coords (top-right + bottom-left) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: vw(1347),
          top: vw(-565),
          width: vw(1101),
          height: vw(1101),
          opacity: 0.1,
          background:
            "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100, 13, 251, 0) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: vw(-621),
          top: vw(509),
          width: vw(1181),
          height: vw(1181),
          opacity: 0.1,
          background:
            "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100, 13, 251, 0) 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Section heading */}
        <div className="text-center mb-8 md:mb-16">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.2,
              color: "#111",
            }}
          >
            {"Static SBOMs Create Blind "}
            <span className="cs-text-gradient-impact">Spots</span>
          </h2>
        </div>

        {/* ── DESKTOP 2×2 grid (md+) ── */}
        <div
          className="hidden md:grid md:grid-cols-2"
          style={{ gap: "0" }}
        >
          {RISKS.map((risk, i) => {
            const isRight = i % 2 === 1;
            const isBottom = i >= 2;
            return (
              <div
                key={risk.id}
                className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start"
                style={{
                  padding: "clamp(20px, 2.5vw, 40px) clamp(16px, 2.5vw, 48px)",
                }}
              >
                {/* Right divider — only in 2-col layout (md+) */}
                {!isRight && (
                  <div
                    aria-hidden
                    className="hidden md:block absolute right-0 top-6 bottom-6 w-px"
                    style={{ backgroundColor: "rgba(217,217,217,0.8)" }}
                  />
                )}
                {/* Bottom divider */}
                {!isBottom && (
                  <div
                    aria-hidden
                    className="absolute bottom-0 left-4 right-4"
                    style={{ height: "1px", backgroundColor: "rgba(217,217,217,0.8)" }}
                  />
                )}

                {/* Purple glow */}
                <div
                  aria-hidden
                  className="pointer-events-none select-none absolute"
                  style={{
                    left: isRight ? "auto" : "32px",
                    top: "12px",
                    width: "165px",
                    height: "165px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, rgba(154,81,255,0.22) 0%, rgba(154,81,255,0) 70%)",
                  }}
                />

                {/* 3D icon */}
                <div className="relative shrink-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-[220px] lg:h-[220px]">
                  <Image
                    src={risk.icon}
                    alt={risk.iconAlt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 96px, (max-width: 1280px) 144px, 220px"
                    loading="lazy"
                  />
                </div>

                {/* Text */}
                <div
                  className="flex flex-col text-center sm:text-left"
                  style={{ gap: "12px", paddingTop: "4px" }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(22px, 2.4vw, 32px)",
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      color: "#111",
                    }}
                  >
                    {risk.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "clamp(15px, 1.4vw, 20px)",
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.4,
                      color: "#333",
                    }}
                  >
                    {risk.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MOBILE stacked cards (< md) ── */}
        <div className="md:hidden flex flex-col items-center" style={{ gap: "16px" }}>
          {RISKS.map((risk) => (
            <div
              key={risk.id}
              className="relative overflow-hidden w-full"
              style={{
                maxWidth: "328px",
                height: "206px",
                borderRadius: "24px",
                background: "white",
              }}
            >
              {/* Card border frame SVG */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sbom/mobile-risk-card-bg.svg"
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none"
                loading="lazy"
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center pt-[10px]">
                {/* Icon area with glow */}
                <div className="relative flex items-center justify-center" style={{ width: "108px", height: "87px" }}>
                  {/* Purple glow circle */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/sbom/mobile-risk-icon-glow.svg"
                    alt=""
                    aria-hidden
                    className="absolute pointer-events-none"
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "79.75px",
                      height: "79.75px",
                    }}
                    loading="lazy"
                  />
                  {/* Risk icon */}
                  <Image
                    src={risk.mobileIcon}
                    alt={risk.iconAlt}
                    width={80}
                    height={80}
                    className="relative object-contain"
                    style={{ width: "80px", height: "80px" }}
                    loading="lazy"
                  />
                </div>

                {/* Text */}
                <div
                  className="flex flex-col items-center text-center"
                  style={{ gap: "12px", marginTop: "10px" }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "20px",
                      fontWeight: 600,
                      letterSpacing: "-0.05em",
                      lineHeight: 1,
                      color: "#000",
                    }}
                  >
                    {risk.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "14px",
                      fontWeight: 400,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                      color: "#111",
                      opacity: 0.8,
                      maxWidth: "199px",
                    }}
                  >
                    {risk.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
