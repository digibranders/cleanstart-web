import React from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: "88,000+",  label: "CVEs remediated" },
  { value: "~90%",     label: "Average CVE reduction" },
  { value: "352,000+", label: "Engineering hours saved" },
  { value: "10M+",     label: "Packages from verified source" },
  { value: "100%",     label: "Deterministic builds" },
];

export function CleanStartAdvantage() {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="advantage-title"
    >
      {/* Mobile portrait below md, full-bleed photo above. */}
      <Image
        src="/images/home/advantage-bg-mobile.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center md:hidden"
        style={{ filter: "blur(1.5px)", transform: "scale(1.01)" }}
        priority={false}
      />
      <Image
        src="/images/advantage-bg.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center hidden md:block"
        style={{ filter: "blur(1.5px)", transform: "scale(1.01)" }}
        priority={false}
      />
      {/* Dark gradient overlay so title/text remain readable on the photo. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(20,12,55,0.92) 0%, rgba(50,25,135,0.78) 35%, rgba(70,30,180,0.45) 65%, rgba(70,30,180,0.10) 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 py-section-lg">
        <div className="max-w-[517px]">
          <Reveal header>
            <h2
              id="advantage-title"
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              CleanStart{" "}
              <span className="cs-text-gradient-impact">Advantage</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20}>
            <p
              className="mt-6 text-white"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
              }}
            >
              Real results from teams that replaced vulnerable public images with
              CleanStart&rsquo;s hardened, source-built containers
            </p>
          </Reveal>
        </div>

        {/* Two layouts: a vertical stack below lg, and inline stats with
            vertical separators at lg+. */}
        <div className="mt-12 flex flex-col gap-6 sm:mt-14 lg:hidden">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <StatBlock stat={stat} variant="mobile" />
              {i < STATS.length - 1 && <HorizontalDivider />}
            </React.Fragment>
          ))}
        </div>

        <div className="hidden lg:mt-[120px] lg:flex lg:items-start lg:justify-between lg:gap-6">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <StatBlock stat={stat} variant="desktop" />
              {i < STATS.length - 1 && <VerticalDivider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatBlock({
  stat,
  variant,
}: {
  stat: Stat;
  variant: "mobile" | "desktop";
}) {
  if (variant === "mobile") {
    return (
      <div className="flex w-[222px] flex-col gap-3">
        <div
          className="font-display text-white"
          style={{
            whiteSpace: "nowrap",
            fontSize: "var(--fs-h3)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
          }}
        >
          {stat.value}
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
          {stat.label}
        </div>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 flex-col">
      <div
        className="font-display text-white"
        style={{
          whiteSpace: "nowrap",
          fontSize: "32px",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.04em",
        }}
      >
        {stat.value}
      </div>
      <div
        className="mt-5 max-w-[180px] text-white"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "20px",
          fontWeight: 400,
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
        }}
      >
        {stat.label}
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
