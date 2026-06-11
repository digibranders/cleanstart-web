import React from "react";
import { Reveal } from "@/components/ui/Reveal";

/*
 * "Outcomes That Matter" — the CleanStart stats strip (mirrors the homepage
 * CleanStartAdvantage figures) on a dark gradient band. This is the last
 * section before <Footer cta>, so its bottom padding reserves the card-overlap
 * space per the Footer layout contract (`var(--spacing-section-cta)`).
 */

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: "88,000+", label: "CVEs remediated" },
  { value: "~90%", label: "Average CVE reduction" },
  { value: "352,000+", label: "Engineering hours saved" },
  { value: "10M+", label: "Packages from verified source" },
  { value: "100%", label: "Deterministic builds" },
];

export function CisoMetrics(): React.ReactElement {
  return (
    <section
      data-section="CisoMetrics"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
        paddingTop: "clamp(64px, 6.25vw, 120px)",
        paddingBottom: "var(--spacing-section-cta)",
      }}
    >
      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        <Reveal header>
          <h2
            className="font-display text-white text-center mx-auto"
            style={{
              maxWidth: "654px",
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: "clamp(48px, 6vw, 84px)",
            }}
          >
            <span className="cs-text-gradient-impact">Outcomes</span>{" "}
            That Matter
          </h2>
        </Reveal>

        {/* Desktop — inline figures separated by vertical dividers. */}
        <div className="hidden lg:flex lg:items-start lg:justify-between lg:gap-6">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <StatBlock stat={stat} />
              {i < STATS.length - 1 && <VerticalDivider />}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile / tablet — centered vertical stack. */}
        <div className="flex flex-col items-center gap-6 lg:hidden">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <StatBlock stat={stat} mobile />
              {i < STATS.length - 1 && <HorizontalDivider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatBlock({ stat, mobile = false }: { stat: Stat; mobile?: boolean }): React.ReactElement {
  return (
    <div className={`flex shrink-0 flex-col ${mobile ? "items-center text-center" : ""}`}>
      <div
        className="font-display text-white"
        style={{
          whiteSpace: "nowrap",
          fontSize: mobile ? "var(--fs-h3)" : "32px",
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
          fontSize: mobile ? "var(--fs-lead)" : "20px",
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

function VerticalDivider(): React.ReactElement {
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

function HorizontalDivider(): React.ReactElement {
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
