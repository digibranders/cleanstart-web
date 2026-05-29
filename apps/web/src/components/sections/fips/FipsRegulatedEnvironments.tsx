import React from "react";
import { Reveal } from "@/components/ui/Reveal";

interface Sector {
  title: string;
  description: string;
}

const SECTORS: Sector[] = [
  {
    title: "Government & Public Sector",
    description: "Built for regulated federal workloads.",
  },
  {
    title: "Financial Services",
    description: "Validated cryptography for sensitive environments.",
  },
  {
    title: "Healthcare & Life Sciences",
    description: "Secure compliant infrastructure for critical systems.",
  },
  {
    title: "Enterprise Security Teams",
    description: "Reduce operational compliance complexity.",
  },
];

export function FipsRegulatedEnvironments(): React.ReactElement {
  return (
    <section
      data-section="FipsRegulatedEnvironments"
      className="relative isolate overflow-hidden"
      aria-label="Built for Regulated Environments"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/regulated-photo-mobile.png"
        alt=""
        className="absolute inset-0 w-full h-full -z-20 pointer-events-none select-none md:hidden"
        style={{ objectFit: "cover", objectPosition: "center center", filter: "blur(1.5px)", transform: "scale(1.01)" }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/fips/regulated-photo.png"
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
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Built for Regulated{" "}
              <span className="cs-text-gradient-impact">Environments</span>
            </h2>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col gap-6 sm:mt-14 lg:hidden">
          {SECTORS.map((sector, i) => (
            <React.Fragment key={sector.title}>
              <SectorBlock sector={sector} variant="mobile" />
              {i < SECTORS.length - 1 && <HorizontalDivider />}
            </React.Fragment>
          ))}
        </div>

        <div className="hidden lg:mt-[120px] lg:flex lg:items-start lg:justify-between lg:gap-6">
          {SECTORS.map((sector, i) => (
            <React.Fragment key={sector.title}>
              <SectorBlock sector={sector} variant="desktop" />
              {i < SECTORS.length - 1 && <VerticalDivider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectorBlock({
  sector,
  variant,
}: {
  sector: Sector;
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
          {sector.title}
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
          {sector.description}
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
        {sector.title}
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
        {sector.description}
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
