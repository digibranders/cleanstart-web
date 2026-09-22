import type React from "react";
import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import type { ImpactStat } from "@/lib/impact-stats";

/**
 * The platform's measured totals, bridging the hero's customer marquee to the
 * first story.
 *
 * The reference mock put four qualitative claims here ("Lower vulnerability
 * risk", "Less manual security work"). On a page whose whole argument is
 * evidence, an adjective with no number is the weakest thing we could print,
 * so this renders the same `impactStats` global the home page and the Images
 * catalog use. Editors change the numbers in one place and every surface
 * follows.
 *
 * No container and no icons, deliberately. An earlier pass wrapped these in a
 * grey tile on a white band, which inverted the site's card language (cards
 * are white on #f6f6f6 everywhere else) and made the tile the same colour as
 * the section below it, so it read as a hole rather than a card. Four numbers
 * separated by hairlines need no box, and the home page's shield/clock/cube
 * glyphs were drawn for a centred composition, not a row. What is left is the
 * figures, which is the whole point of the band.
 *
 * Monochrome on purpose: the violet carries the hero above and the badges
 * below, so a plain ink-on-white fact line is the rest between them.
 */

function Stat({
  value,
  label,
  divided,
}: {
  value: string;
  label: string;
  divided: boolean;
}): React.ReactElement {
  return (
    <div
      className={
        divided
          ? "relative px-0 lg:px-8 lg:before:absolute lg:before:left-0 lg:before:top-1/2 lg:before:h-16 lg:before:w-px lg:before:-translate-y-1/2 lg:before:bg-black/[0.09] lg:before:content-['']"
          : "relative lg:pr-8"
      }
    >
      <p
        className="font-display text-[#111]"
        style={{
          fontSize: "var(--fs-h2)",
          fontWeight: "var(--fs-h2-weight)",
          lineHeight: 1,
          letterSpacing: "-0.035em",
        }}
      >
        {value}
      </p>
      <p
        className="mt-2.5 font-sans text-[#666]"
        style={{
          fontSize: "var(--fs-body-sm)",
          lineHeight: 1.4,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </p>
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
      padding="md"
      data-section="CaseStudiesImpactStrip"
      className="bg-white"
      ariaLabel="CleanStart by the numbers"
    >
      <Container>
        <Reveal y={24}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-10 lg:grid-cols-4 lg:gap-y-0">
            {stats.map((stat, i) => (
              <Stat key={stat.label} value={stat.value} label={stat.label} divided={i > 0} />
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
