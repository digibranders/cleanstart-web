import Image from "next/image";

/**
 * Figma frame 516:5494 — 1920 × 889 "Built for Modern Software Supply Chains"
 *
 * Light-gray (#f7f7f7) backdrop. Centred heading, then a two-column layout:
 *   • Left  — infinity-loop circuit photo, 512 × 384, blue 1.5px border, r=20
 *   • Right — 2 × 2 card grid (each 354 × 180). The inner corner of every card
 *             is rounded 62px so the cut faces a central infinity-icon ball
 *             that sits at the grid's geometric centre.
 *
 * Card copy:
 *   CI/CD Pipelines           — "Integrate into existing workflows."
 *   Container Environments    — "Track software inventories across images."
 *   Compliance Programs       — "Support modern regulatory requirements."
 *   Enterprise Security Teams — "Improve software supply chain visibility."
 *
 * Responsive: 2-column on lg, image-then-stacked-cards on smaller screens.
 * Uses py-section-md vertical padding token and standard max-w-[var(--container-default)] rail.
 */

const CARDS = [
  {
    id: "cicd",
    title: "CI/CD Pipelines",
    body: "Integrate into existing workflows.",
    cornerRadius: "8px 8px 62px 8px", // br rounded → points down-right toward centre
  },
  {
    id: "container",
    title: "Container Environments",
    body: "Track software inventories across images.",
    cornerRadius: "8px 8px 8px 62px", // bl rounded → down-left toward centre
  },
  {
    id: "compliance",
    title: "Compliance Programs",
    body: "Support modern regulatory requirements.",
    cornerRadius: "8px 62px 8px 8px", // tr rounded → up-right toward centre
  },
  {
    id: "security",
    title: "Enterprise Security Teams",
    body: "Improve software supply chain visibility.",
    cornerRadius: "62px 8px 8px 8px", // tl rounded → up-left toward centre
  },
] as const;

export function SbomAdvantage(): React.ReactElement {
  return (
    <section
      data-section="SbomAdvantage"
      className="relative overflow-hidden bg-[#f7f7f7] w-full"
    >
      {/* Decorative cyan halo bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "-220px",
          bottom: "-140px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.18) 0%, rgba(44,193,235,0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 py-section-md" style={{ paddingBottom: "250px" }}>
        {/* Heading */}
        <div className="text-center mb-10 md:mb-14">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.23vw, 62px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            {"Built for Modern Software "}
            <span
              style={{
                background:
                  "linear-gradient(103.5deg, #9A51FF 1.76%, #2CC1EB 98.78%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Supply Chains
            </span>
          </h2>
        </div>

        {/* Image + 2×2 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-[512fr_708fr] gap-6 lg:gap-8 items-stretch">
          {/* Left: infinity circuit image */}
          <div
            className="relative overflow-hidden w-full"
            style={{
              borderRadius: "20px",
              border: "1.5px solid #076eff",
              aspectRatio: "512/384",
              minHeight: "260px",
            }}
          >
            <Image
              src="/images/sbom/infinity-circuit.png"
              alt="CleanStart SBOM continuous delivery loop"
              fill
              sizes="(min-width: 1024px) 512px, 100vw"
              className="object-cover"
              loading="lazy"
            />
          </div>

          {/* Right: 2×2 grid with central infinity ball icon */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {CARDS.map((card) => (
              <article
                key={card.id}
                className="bg-white w-full"
                style={{
                  borderRadius: card.cornerRadius,
                  border: "1.5px solid rgba(0,0,0,0.06)",
                  padding: "clamp(20px, 1.67vw, 32px)",
                  minHeight: "clamp(150px, 11.5vw, 180px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <p
                  className="text-card-title-lg text-[#111]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {card.title}
                </p>
                <p
                  className="text-body-md text-[#333]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {card.body}
                </p>
              </article>
            ))}

            {/* Central infinity ball — hidden below sm to avoid overlap */}
            <div
              aria-hidden
              className="hidden sm:flex absolute items-center justify-center"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                boxShadow:
                  "0 4.63px 10.9px rgba(28,60,142,0.33), inset 0 -0.17px 0.22px rgba(0,44,179,0.5), inset 0 0.09px 0.44px rgba(255,255,255,0.81)",
                zIndex: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sbom/icon-infinity.svg"
                alt=""
                style={{ width: "34px", height: "40px", display: "block" }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
