import { FipsBall } from "./FipsBall";

interface MatterCard {
  title: string;
  description: string;
  icon: string;
}

const TOP_ROW: MatterCard[] = [
  {
    title: "Validated Cryptography",
    description: "Trusted cryptographic modules for regulated environments.",
    icon: "/images/fips/why-icon-validated-crypto.svg",
  },
  {
    title: "Centralized Crypto Management",
    description: "Consistent cryptographic standards across environments.",
    icon: "/images/fips/why-icon-centralized-mgmt.svg",
  },
  {
    title: "Verified Secure Boot",
    description: "Protect workload integrity during startup.",
    icon: "/images/fips/why-icon-secure-boot.svg",
  },
];

const BOTTOM_ROW: MatterCard[] = [
  {
    title: "Automated Compliance Documentation",
    description: "Continuous evidence generation for audits.",
    icon: "/images/fips/why-icon-compliance-docs.svg",
  },
  {
    title: "Continuous Compliance Monitoring",
    description: "Track cryptographic compliance across deployments.",
    icon: "/images/fips/why-icon-compliance-monitoring.svg",
  },
];

export function FipsWhyMatters(): React.ReactElement {
  return (
    <section
      data-section="FipsWhyMatters"
      className="relative bg-white overflow-hidden"
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-10 pt-14 md:pt-[88px] pb-14 md:pb-[112px]">
        {/* Heading + intro
         * Mobile (Figma 913:218): both H2 and body are text-center, gap ~16px, mb ~24px.
         * Desktop: side-by-side 2-col, text-left.
         */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 mb-6 md:mb-[64px]">
          <h2
            className="text-[#111] text-center md:text-left"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "444px",
            }}
          >
            Why FIPS 140-3{" "}
            <span className="cs-text-gradient-impact">Matters</span>
          </h2>
          <p
            className="text-[#333] text-center md:text-left"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.45,
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
        /* Mobile (Figma 913:218): card h=225px. Desktop: up to 284px. */
        minHeight: "clamp(225px, 22vw, 284px)",
      }}
    >
      {/*
       * Ball icon — same Figma icon on mobile and desktop.
       * Mobile: 70px centered. Desktop: 92px right-aligned.
       */}
      <div className="flex justify-center md:justify-end mb-6">
        <div className="block md:hidden">
          <FipsBall size={70} iconSrc={card.icon} />
        </div>
        <div className="hidden md:block">
          <FipsBall size={92} iconSrc={card.icon} />
        </div>
      </div>

      {/*
       * Text block:
       * Mobile (Figma 913:218): text-center, title 20px SemiBold, desc 14px lh=1.1.
       * Desktop: text-left.
       */}
      <div className="text-center md:text-left">
        <p
          className="text-[#111] mb-2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h3)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
          }}
        >
          {card.title}
        </p>
        <p
          className="text-[#333]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            opacity: 0.8,
          }}
        >
          {card.description}
        </p>
      </div>
    </div>
  );
}
