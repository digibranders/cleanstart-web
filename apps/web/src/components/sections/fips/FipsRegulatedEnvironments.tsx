import React from "react";
import { Reveal } from "@/components/ui/Reveal";

interface Pillar {
  title: string;
  description: string;
}

const PILLARS: Pillar[] = [
  {
    title: "Faster Audit Readiness",
    description: "Pre-built evidence and validated foundations simplify audits.",
  },
  {
    title: "Compliance Simplified",
    description:
      "Spend less time collecting and maintaining compliance artifacts.",
  },
  {
    title: "Consistent Compliance",
    description:
      "Maintain approved cryptographic standards across environments.",
  },
  {
    title: "Continuous Assurance",
    description: "Monitor compliance posture throughout the software lifecycle.",
  },
];

export function FipsRegulatedEnvironments(): React.ReactElement {
  return (
    <section
      data-section="FipsRegulatedEnvironments"
      className="relative isolate overflow-hidden"
      aria-label="Built-In Compliance. Measurable Impact."
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/regulated-photo-mobile.webp"
        alt=""
        className="absolute inset-0 w-full h-full -z-20 pointer-events-none select-none md:hidden"
        style={{ objectFit: "cover", objectPosition: "center center", filter: "blur(1.5px)", transform: "scale(1.01)" }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/regulated-photo.webp"
        alt=""
        className="absolute inset-0 w-full h-full -z-20 pointer-events-none select-none hidden md:block"
        style={{ objectFit: "cover", objectPosition: "center center", filter: "blur(1.5px)", transform: "scale(1.01)" }}
        loading="lazy"
        decoding="async"
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(20,12,55,0.92) 0%, rgba(50,25,135,0.78) 35%, rgba(70,30,180,0.45) 65%, rgba(70,30,180,0.10) 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 py-section-lg">
        <div className="max-w-[770px]">
          <Reveal header>
            <h2
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Built-In Compliance.{" "}
              <span className="cs-text-gradient-impact">Measurable Impact.</span>
            </h2>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col gap-6 sm:mt-14 lg:hidden">
          {PILLARS.map((pillar, i) => (
            <React.Fragment key={pillar.title}>
              <PillarBlock pillar={pillar} variant="mobile" />
              {i < PILLARS.length - 1 && <HorizontalDivider />}
            </React.Fragment>
          ))}
        </div>

        <div className="hidden lg:mt-[120px] lg:flex lg:items-start lg:justify-between lg:gap-6">
          {PILLARS.map((pillar, i) => (
            <React.Fragment key={pillar.title}>
              <PillarBlock pillar={pillar} variant="desktop" />
              {i < PILLARS.length - 1 && <VerticalDivider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarBlock({
  pillar,
  variant,
}: {
  pillar: Pillar;
  variant: "mobile" | "desktop";
}) {
  if (variant === "mobile") {
    return (
      <div className="flex w-[222px] flex-col gap-3">
        <div
          className="font-display text-white"
          style={{
            fontSize: "var(--fs-h3)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
          }}
        >
          {pillar.title}
        </div>
        <div
          className="text-white"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-lead)",
            fontWeight: 400,
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
          }}
        >
          {pillar.description}
        </div>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 flex-col">
      <div
        className="font-display text-white"
        style={{
          fontSize: "var(--fs-h3)",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.04em",
          maxWidth: "219px",
        }}
      >
        {pillar.title}
      </div>
      <div
        className="mt-5 max-w-[219px] text-white"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "20px",
          fontWeight: 400,
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
        }}
      >
        {pillar.description}
      </div>
    </div>
  );
}

function VerticalDivider() {
  return (
    <div
      aria-hidden
      className="h-[109px] w-px shrink-0 self-stretch"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 49.3%, rgba(153,153,153,0) 99.2%)",
      }}
    />
  );
}

function HorizontalDivider() {
  return (
    <div
      aria-hidden
      className="h-px w-[147px] shrink-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, #FFFFFF 49.32%, rgba(153,153,153,0) 99.18%)",
      }}
    />
  );
}
