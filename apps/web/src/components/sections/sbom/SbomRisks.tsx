import Image from "next/image";

/**
 * Figma frame 161:21113 — 1920 × 1088 "When SBOMs Fall Short, Risk Grows"
 *
 * White background section with a 2×2 grid of risk cards.
 * Each card has a 3D icon, a bold title, and a description.
 * A subtle dividing line separates the left and right columns,
 * and a horizontal line separates the top and bottom rows.
 */

const RISKS = [
  {
    id: "incomplete",
    icon: "/images/sbom/risk-icon-incomplete.png",
    iconAlt: "Incomplete Visibility icon",
    title: "Incomplete Visibility",
    body: "Missing packages and dependencies hide risk.",
  },
  {
    id: "traceability",
    icon: "/images/sbom/risk-icon-traceability.png",
    iconAlt: "Broken Traceability icon",
    title: "Broken Traceability",
    body: "Disconnected inventories weaken provenance tracking.",
  },
  {
    id: "stale",
    icon: "/images/sbom/risk-icon-stale.png",
    iconAlt: "Stale Data icon",
    title: "Stale Data",
    body: "Static SBOMs quickly become outdated.",
  },
  {
    id: "compliance",
    icon: "/images/sbom/risk-icon-compliance.png",
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

      <div
        className="relative mx-auto"
        style={{ maxWidth: "1276px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        {/* Section heading */}
        <div className="text-center mb-8 md:mb-16">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-t-display-2)",
              fontWeight: 700,
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
              color: "#111",
            }}
          >
            {"Static SBOMs Create Blind "}
            <span
              style={{
                background:
                  "linear-gradient(103deg, #9A51FF 1.76%, #2CC1EB 98.78%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Spots
            </span>
          </h2>
        </div>

        {/* 2×2 grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2"
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

                {/* Purple glow — hidden on small screens */}
                <div
                  aria-hidden
                  className="pointer-events-none select-none absolute hidden sm:block"
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

                {/* 3D icon — responsive size */}
                <div className="relative shrink-0 w-24 h-24 sm:w-36 sm:h-36 xl:w-[220px] xl:h-[220px]">
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
                      fontSize: "var(--text-t-heading-lg)",
                      fontWeight: 700,
                      letterSpacing: "var(--text-t-heading-lg-ls)",
                      lineHeight: "var(--text-t-heading-lg-lh)",
                      color: "#111",
                    }}
                  >
                    {risk.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-t-body-lg)",
                      fontWeight: 400,
                      letterSpacing: "var(--text-t-body-lg-ls)",
                      lineHeight: "var(--text-t-body-lg-lh)",
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
      </div>
    </section>
  );
}
