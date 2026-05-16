import { FipsBall } from "./FipsBall";

interface Stage {
  title: string;
  description: string;
}

const STAGES: Stage[] = [
  {
    title: "Harden Foundations",
    description: "Validated cryptographic starting point.",
  },
  {
    title: "Standardize Cryptography",
    description: "Consistent security across environments.",
  },
  {
    title: "Validate Compliance",
    description: "Continuous evidence and verification.",
  },
  {
    title: "Continuously Monitor",
    description: "Track cryptographic compliance over time.",
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
        className="pointer-events-none select-none absolute hidden xl:block"
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
        className="pointer-events-none select-none absolute hidden xl:block"
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

      <div className="relative mx-auto max-w-[1276px] px-6 pt-16 md:pt-[80px] pb-16 md:pb-[88px]">
        <h2
          className="text-center text-[#111] mb-12 md:mb-[64px]"
          style={{
            fontFamily: "var(--font-figtree)",
            fontSize: "clamp(28px, 3.23vw, 62px)",
            fontWeight: 600,
            letterSpacing: "-0.05em",
            lineHeight: 1.05,
          }}
        >
          CleanStart FIPS 140-3{" "}
          <br className="hidden md:block" />
          Maturity{" "}
          <span
            style={{
              background:
                "linear-gradient(95deg, #239CFF 0%, #82AEFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Model
          </span>
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
        minHeight: "320px",
      }}
    >
      <FipsBall size={84} />

      <div>
        <p
          className="text-[#111] mb-2"
          style={{
            fontFamily: "var(--font-figtree)",
            fontSize: "clamp(20px, 1.46vw, 26px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.15,
          }}
        >
          {stage.title}
        </p>
        <p
          className="text-[#333]"
          style={{
            fontFamily: "var(--font-figtree)",
            fontSize: "clamp(14px, 1.04vw, 17px)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.45,
            opacity: 0.85,
          }}
        >
          {stage.description}
        </p>
      </div>
    </div>
  );
}
