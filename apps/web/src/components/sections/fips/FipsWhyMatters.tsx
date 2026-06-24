import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

interface MatterCard {
  title: string;
  description: string;
  icon: string;
}

const CARDS: MatterCard[] = [
  {
    title: "Validation Complexity",
    description: "Certified cryptographic modules are difficult to maintain.",
    icon: "/images/fips/why-1.webp",
  },
  {
    title: "Audit Readiness",
    description: "Evidence collection is often manual and fragmented.",
    icon: "/images/fips/why-4.webp",
  },
  {
    title: "Deployment Consistency",
    description: "Compliance can drift across environments.",
    icon: "/images/fips/why-2.svg",
  },
  {
    title: "Continuous Verification",
    description: "Maintaining compliance requires ongoing oversight.",
    icon: "/images/fips/why-5.webp",
  },
];

export function FipsWhyMatters(): React.ReactElement {
  return (
    <section
      data-section="FipsWhyMatters"
      className="relative bg-white overflow-hidden"
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-4 sm:px-10 pt-14 md:pt-[88px] pb-14 md:pb-[112px]">
        <Reveal header>
          <h2
            className="text-[#111] text-center mx-auto"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "640px",
              marginBottom: "clamp(40px, 4.44vw, 64px)",
            }}
          >
            Why FIPS Compliance Is{" "}
            <span className="cs-text-gradient-impact">Difficult</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {CARDS.map((card) => (
            <MatterTile key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Soft blue corner glow — Figma Ellipse 46680. Clipped by the card's
    overflow-hidden so only the in-card quarter reads as a tinted corner. */
function CornerGlow(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        width: "258px",
        height: "257px",
        top: "-56px",
        left: "-50px",
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

function MatterTile({ card }: { card: MatterCard }): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden rounded-[24px] px-7 py-7"
      style={{
        background:
          "linear-gradient(160deg, #E9F1FF 0%, #FFFFFF 65%, #FFFFFF 100%)",
        boxShadow:
          "0 24px 48px -24px rgba(35, 90, 220, 0.18), 0 1px 0 rgba(255,255,255,0.85) inset",
        minHeight: "clamp(225px, 22vw, 284px)",
      }}
    >
      <CornerGlow />
      <div className="relative flex justify-center md:justify-start mb-6">
        <MatterIcon src={card.icon} />
      </div>
      <div className="relative text-center md:text-left">
        <p
          className="text-[#111] mb-2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h3)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            minHeight: "2.2em",
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
