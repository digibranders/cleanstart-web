import { FipsBall } from "./FipsBall";

interface MatterCard {
  title: string;
  description: string;
}

const TOP_ROW: MatterCard[] = [
  {
    title: "Validated Cryptography",
    description: "Trusted cryptographic modules for regulated environments.",
  },
  {
    title: "Centralized Crypto Management",
    description: "Consistent cryptographic standards across environments.",
  },
  {
    title: "Verified Secure Boot",
    description: "Protect workload integrity during startup.",
  },
];

const BOTTOM_ROW: MatterCard[] = [
  {
    title: "Automated Compliance Documentation",
    description: "Continuous evidence generation for audits.",
  },
  {
    title: "Continuous Compliance Monitoring",
    description: "Track cryptographic compliance across deployments.",
  },
];

export function FipsWhyMatters(): React.ReactElement {
  return (
    <section
      data-section="FipsWhyMatters"
      className="relative bg-white overflow-hidden"
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-16 md:pt-[88px] pb-16 md:pb-[112px]">
        {/* Heading + intro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-[64px]">
          <h2
            className="text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-t-display-2)",
              fontWeight: 600,
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
              maxWidth: "444px",
            }}
          >
            Why FIPS 140-3{" "}
            <span
              style={{
                background:
                  "linear-gradient(95deg, #239CFF 0%, #82AEFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Matters
            </span>
          </h2>
          <p
            className="text-[#333]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-t-subhead)",
              fontWeight: 400,
              letterSpacing: "var(--text-t-subhead-ls)",
              lineHeight: "var(--text-t-subhead-lh)",
              maxWidth: "731px",
            }}
          >
            FIPS 140-3 defines the standard for trusted cryptography. It governs
            how encryption must be implemented and proven in regulated
            industries. 79% of organizations have delayed releases due to
            security or compliance gaps. FIPS exists to close that risk.
          </p>
        </div>

        {/* Top row — 3 cards at 33.33% each (Figma: 3 × 404w, 32px gap) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
          {TOP_ROW.map((card) => (
            <MatterTile key={card.title} card={card} />
          ))}
        </div>

        {/* Bottom row — 2 cards at 50% each (Figma: 2 × 624w, 27px gap) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {BOTTOM_ROW.map((card) => (
            <MatterTile key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MatterTile({ card }: { card: MatterCard }): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden rounded-[24px] px-7 py-7"
      style={{
        background:
          "linear-gradient(160deg, #E9F1FF 0%, #FFFFFF 65%, #FFFFFF 100%)",
        boxShadow:
          "0 24px 48px -24px rgba(35, 90, 220, 0.18), 0 1px 0 rgba(255,255,255,0.85) inset",
        minHeight: "clamp(240px, 22vw, 284px)",
      }}
    >
      {/* Top-right ball icon */}
      <div className="flex justify-end mb-6">
        <FipsBall size={92} />
      </div>

      <div>
        <p
          className="text-[#111] mb-2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-t-heading-lg)",
            fontWeight: 700,
            letterSpacing: "var(--text-t-heading-lg-ls)",
            lineHeight: "var(--text-t-heading-lg-lh)",
          }}
        >
          {card.title}
        </p>
        <p
          className="text-[#333]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-t-body-lg)",
            fontWeight: 400,
            letterSpacing: "var(--text-t-body-lg-ls)",
            lineHeight: "var(--text-t-body-lg-lh)",
            opacity: 0.85,
          }}
        >
          {card.description}
        </p>
      </div>
    </div>
  );
}
