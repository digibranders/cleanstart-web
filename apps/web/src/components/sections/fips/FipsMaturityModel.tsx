import { FipsBall } from "./FipsBall";

interface Stage {
  title: string;
  description: string;
  icon: string;
}

const STAGES: Stage[] = [
  {
    title: "Harden Foundations",
    description: "Validated cryptographic starting point.",
    icon: "/images/fips/maturity-icon-harden.svg",
  },
  {
    title: "Standardize Cryptography",
    description: "Consistent security across environments.",
    icon: "/images/fips/maturity-icon-standardize.svg",
  },
  {
    title: "Validate Compliance",
    description: "Continuous evidence and verification.",
    icon: "/images/fips/maturity-icon-validate.svg",
  },
  {
    title: "Continuously Monitor",
    description: "Track cryptographic compliance over time.",
    icon: "/images/fips/maturity-icon-monitor.svg",
  },
];

export function FipsMaturityModel(): React.ReactElement {
  return (
    <section
      data-section="FipsMaturityModel"
      className="relative bg-white overflow-hidden"
    >
      {/* Decorative side accents */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-40px",
          top: "55%",
          transform: "translateY(-50%)",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(178, 205, 255, 0.45) 0%, rgba(178, 205, 255, 0) 75%)",
          filter: "blur(20px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          right: "-40px",
          top: "55%",
          transform: "translateY(-50%)",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(218, 182, 243, 0.45) 0%, rgba(218, 182, 243, 0) 75%)",
          filter: "blur(20px)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-10 pt-14 md:pt-[80px] pb-14 md:pb-[88px]">
        <h2
          className="text-center text-[#111] mb-12 md:mb-[64px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
          }}
        >
          CleanStart FIPS 140-3 Maturity{" "}
          <span className="cs-text-gradient-impact">Model</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAGES.map((stage) => (
            <StageCard key={stage.title} stage={stage} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StageCard({ stage }: { stage: Stage }): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden rounded-[24px] px-6 py-7 flex flex-col gap-5"
      style={{
        background:
          "linear-gradient(180deg, #F5EEFD 0%, #FFFFFF 100%)",
        border: "1px solid rgba(218, 182, 243, 0.55)",
        boxShadow:
          "0 20px 36px -22px rgba(132, 80, 255, 0.18), 0 1px 0 rgba(255,255,255,0.85) inset",
        /* Mobile: 226px (Figma 366:7788 card h=226px) */
        minHeight: "clamp(226px, 24vw, 320px)",
      }}
    >
      <FipsBall size={84} iconSrc={stage.icon} />

      <div>
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
          {stage.title}
        </p>
        <p
          className="text-[#333]"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.5,
            opacity: 0.8,
          }}
        >
          {stage.description}
        </p>
      </div>
    </div>
  );
}
