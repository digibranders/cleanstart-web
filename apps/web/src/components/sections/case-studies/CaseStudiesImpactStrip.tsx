import type React from "react";
import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import type { ImpactStat } from "@/lib/impact-stats";

/**
 * The platform's measured totals, handing off from the hero's customer
 * marquee to the first story.
 *
 * The reference mock put four qualitative claims here ("Lower vulnerability
 * risk", "Less manual security work"). On a page whose whole argument is
 * evidence, an adjective with no number is the weakest thing we could print,
 * so this renders the same `impactStats` global the home page and the Images
 * catalog use. Editors change the numbers in one place and every surface
 * follows.
 *
 * No heading: the hero above already says who trusts us and the section below
 * opens the first story. A third heading between them would be an interruption
 * rather than a signpost.
 */

const STAT_ICONS = [
  "/images/home/stats/shield.svg",
  "/images/home/stats/trend.svg",
  "/images/home/stats/clock.svg",
  "/images/home/stats/cube.svg",
] as const;

function StatCell({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-3 px-2 py-4 sm:px-4 lg:px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        aria-hidden
        width={36}
        height={36}
        loading="lazy"
        decoding="async"
        className="size-9 shrink-0 select-none"
      />
      <div className="min-w-0">
        <p
          className="font-display font-semibold text-[#111]"
          style={{
            fontSize: "var(--fs-h4)",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </p>
        <p
          className="font-sans text-[#666]"
          style={{
            fontSize: "var(--fs-body-sm)",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

export function CaseStudiesImpactStrip({
  stats,
}: {
  stats: readonly ImpactStat[];
}): React.ReactElement | null {
  if (stats.length === 0) return null;

  return (
    <Section
      padding="sm"
      data-section="CaseStudiesImpactStrip"
      className="bg-white"
      ariaLabel="CleanStart by the numbers"
    >
      <Container>
        <Reveal y={24}>
          <div
            className="grid grid-cols-1 rounded-[24px] bg-[#f6f6f6] px-4 py-2 sm:grid-cols-2 sm:rounded-[28px] sm:px-6 lg:grid-cols-4 lg:py-3"
            style={{ border: "1px solid rgba(17,17,17,0.06)" }}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={
                  i > 0
                    ? "relative lg:before:absolute lg:before:left-0 lg:before:top-1/2 lg:before:h-14 lg:before:w-px lg:before:-translate-y-1/2 lg:before:bg-black/[0.08] lg:before:content-['']"
                    : "relative"
                }
              >
                <StatCell
                  icon={STAT_ICONS[i % STAT_ICONS.length] ?? STAT_ICONS[0]}
                  value={stat.value}
                  label={stat.label}
                />
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
