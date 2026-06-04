import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

interface MatterCard {
  title: string;
  description: string;
  icon: string;
}

const TOP_ROW: MatterCard[] = [
  {
    title: "Validated Cryptography",
    description: "Trusted cryptographic modules for regulated environments.",
    icon: "/images/fips/why-1.png",
  },
  {
    title: "Centralized Crypto Management",
    description: "Consistent cryptographic standards across environments.",
    icon: "/images/fips/why-2.svg",
  },
  {
    title: "Verified Secure Boot",
    description: "Protect workload integrity during startup.",
    icon: "/images/fips/why-3.png",
  },
];

const BOTTOM_ROW: MatterCard[] = [
  {
    title: "Automated Compliance Documentation",
    description: "Continuous evidence generation for audits.",
    icon: "/images/fips/why-4.png",
  },
  {
    title: "Continuous Compliance Monitoring",
    description: "Track cryptographic compliance across deployments.",
    icon: "/images/fips/why-5.png",
  },
];

export function FipsWhyMatters(): React.ReactElement {
  return (
    <section
      data-section="FipsWhyMatters"
      className="relative bg-white overflow-hidden"
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-10 pt-14 md:pt-[88px] pb-14 md:pb-[112px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 mb-6 md:mb-[64px]">
          <Reveal header>
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
              <span style={{ whiteSpace: "nowrap" }}>Why FIPS 140-3</span>{" "}
              <span className="cs-text-gradient-impact" style={{ display: "block" }}>
                Matters
              </span>
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20}>
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
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
          {TOP_ROW.map((card) => (
            <MatterTile key={card.title} card={card} layout="stack" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {BOTTOM_ROW.map((card) => (
            <MatterTile key={card.title} card={card} layout="split" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Soft blue corner glow — Figma Ellipse 46680. Clipped by the card's
    overflow-hidden so only the in-card quarter reads as a tinted corner. */
function CornerGlow({ side }: { side: "left" | "right" }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        width: "258px",
        height: "257px",
        top: "-56px",
        [side]: "-50px",
        borderRadius: "50%",
        background: "#008CFF",
        opacity: 0.2,
        filter: "blur(40px)",
      }}
    />
  );
}

function MatterIcon({ src }: { src: string }): React.ReactElement {
  if (src.endsWith(".svg")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        width={404}
        height={404}
        className="pointer-events-none select-none h-auto w-[84px] md:w-[116px]"
      />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={404}
      height={404}
      sizes="(min-width: 768px) 116px, 84px"
      className="pointer-events-none select-none h-auto w-[84px] md:w-[116px]"
    />
  );
}

function CardText({ card }: { card: MatterCard }): React.ReactElement {
  return (
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
  );
}

function MatterTile({
  card,
  layout,
}: {
  card: MatterCard;
  layout: "stack" | "split";
}): React.ReactElement {
  const cardStyle = {
    background:
      "linear-gradient(160deg, #E9F1FF 0%, #FFFFFF 65%, #FFFFFF 100%)",
    boxShadow:
      "0 24px 48px -24px rgba(35, 90, 220, 0.18), 0 1px 0 rgba(255,255,255,0.85) inset",
    minHeight: "clamp(225px, 22vw, 284px)",
  } as const;

  if (layout === "split") {
    // Bottom row: text on the left, icon pinned to the top-right corner.
    return (
      <div
        className="relative overflow-hidden rounded-[24px] px-7 py-7"
        style={cardStyle}
      >
        <CornerGlow side="right" />
        <div className="relative flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-between">
          <div className="order-2 md:order-1 flex-1">
            <CardText card={card} />
          </div>
          <div className="order-1 md:order-2 shrink-0">
            <MatterIcon src={card.icon} />
          </div>
        </div>
      </div>
    );
  }

  // Top row: icon on the left, text stacked beneath.
  return (
    <div
      className="relative overflow-hidden rounded-[24px] px-7 py-7"
      style={cardStyle}
    >
      <CornerGlow side="left" />
      <div className="relative flex justify-center md:justify-start mb-6">
        <MatterIcon src={card.icon} />
      </div>
      <div className="relative">
        <CardText card={card} />
      </div>
    </div>
  );
}
