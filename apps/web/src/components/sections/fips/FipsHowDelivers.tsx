import { Reveal } from "@/components/ui/Reveal";

type IconName = "shield" | "doc" | "layers" | "pulse";

interface DeliveryStep {
  title: string;
  description: string;
  icon: IconName;
}

const STEPS: DeliveryStep[] = [
  {
    title: "Validated Cryptography",
    description: "Built on FIPS-validated cryptographic modules.",
    icon: "shield",
  },
  {
    title: "Automated Evidence",
    description: "Generate audit-ready compliance artifacts.",
    icon: "doc",
  },
  {
    title: "Consistent Cryptography",
    description: "Apply approved cryptography across environments.",
    icon: "layers",
  },
  {
    title: "Continuous Assurance",
    description: "Monitor compliance posture throughout deployment.",
    icon: "pulse",
  },
];

export function FipsHowDelivers(): React.ReactElement {
  return (
    <section
      data-section="FipsHowDelivers"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #F5F4FF 48%, #FFFFFF 100%)",
      }}
    >
      {/* Soft purple glow behind the heading — echoes the page's radial accents. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          top: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "640px",
          height: "320px",
          background:
            "radial-gradient(closest-side, rgba(118, 62, 255, 0.14) 0%, rgba(118, 62, 255, 0) 72%)",
          filter: "blur(24px)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 py-section-lg">
        <Reveal header>
          <h2
            className="font-display text-[#111] text-center mx-auto"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "640px",
            }}
          >
            How CleanStart Delivers{" "}
            <span className="cs-text-gradient-impact">Compliance</span>
          </h2>
        </Reveal>

        <div
          className="relative"
          style={{ marginTop: "clamp(48px, 6vw, 88px)" }}
        >
          {/* Connector line behind the tile row — desktop only. Spans from the
              first tile centre (12.5%) to the last (87.5%) and fades at both
              ends. Solid tiles sit on top and break it into segments. */}
          <div
            aria-hidden
            className="pointer-events-none absolute hidden lg:block"
            style={{
              top: "31px",
              left: "12.5%",
              right: "12.5%",
              height: "2px",
              background:
                "linear-gradient(90deg, rgba(46,125,255,0) 0%, rgba(46,125,255,0.40) 18%, rgba(46,125,255,0.40) 82%, rgba(46,125,255,0) 100%)",
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 sm:gap-x-10">
            {STEPS.map((step) => (
              <StepNode key={step.title} step={step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepNode({ step }: { step: DeliveryStep }): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div
        className="relative flex h-16 w-16 items-center justify-center rounded-[18px]"
        style={{
          background: "linear-gradient(150deg, #EEF3FF 0%, #DCE7FF 100%)",
          boxShadow:
            "0 14px 28px -12px rgba(37, 99, 235, 0.30), 0 1px 0 rgba(255,255,255,0.85) inset",
        }}
      >
        <StepIcon name={step.icon} />
      </div>

      <p
        className="text-[#111]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-h3)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          marginTop: "clamp(20px, 2vw, 28px)",
          marginBottom: "8px",
          minHeight: "2.2em",
          maxWidth: "240px",
        }}
      >
        {step.title}
      </p>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1.4,
          color: "#333",
          opacity: 0.8,
          maxWidth: "240px",
        }}
      >
        {step.description}
      </p>
    </div>
  );
}

/**
 * Duotone stroke icons (2px) — a deliberately distinct icon family from the
 * 3D circular badges used elsewhere on the page. Primary shape carries a faint
 * fill; detail strokes sit on top in brand blue.
 */
function StepIcon({ name }: { name: IconName }): React.ReactElement {
  const stroke = "#2563EB";
  const fill = "rgba(37, 99, 235, 0.10)";
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "pointer-events-none select-none",
  };

  switch (name) {
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" fill={fill} />
          <path d="M9 12l2.2 2.2L15 10.4" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <path
            d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
            fill={fill}
          />
          <path d="M14 3v5h5" />
          <path d="M9 14.5l1.8 1.8L14.5 12.6" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common}>
          <path d="M12 3l9 5-9 5-9-5 9-5z" fill={fill} />
          <path d="M3 12.5l9 5 9-5" />
          <path d="M3 16.5l9 5 9-5" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill={fill} />
          <path d="M7 12h2l1.6-3.6L13 15l1.4-3H17" />
        </svg>
      );
  }
}
