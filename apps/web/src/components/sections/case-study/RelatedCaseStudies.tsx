import type React from "react";
import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { ArrowRightIcon } from "@/components/sections/case-studies/CaseStudyIcons";
import { CaseStudyCard } from "@/components/sections/case-studies/CaseStudyCard";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import type { CaseStudy } from "@/lib/case-studies";

/**
 * Where to go next. Same-industry studies first, because a reader who opened a
 * finance study is looking for finance, then the rest by recency.
 *
 * This is the last section before `<Footer cta>`, so it owes the footer one
 * CTA-card half of its own background to overlap into — see the layout
 * contract in Footer.tsx. Without the reservation the card lands on top of the
 * cards' own CTAs.
 */
export function RelatedCaseStudies({
  studies,
}: {
  studies: readonly CaseStudy[];
}): React.ReactElement | null {
  if (studies.length === 0) return null;
  // Track count follows the card count. A three-column grid holding two cards
  // reads as a missing card rather than a deliberate pair.
  // Content-width tracks, not fractions: `1fr` columns stretch to fill the
  // container and leave the cards stranded at opposite edges, so `justify-center`
  // has nothing to centre.
  const columns = Math.min(studies.length, 3);
  const columnClass =
    columns === 1
      ? "lg:grid-cols-[minmax(0,380px)]"
      : columns === 2
        ? "lg:grid-cols-[repeat(2,minmax(0,380px))]"
        : "lg:grid-cols-[repeat(3,minmax(0,380px))]";

  return (
    <Section
      padding="none"
      data-section="RelatedCaseStudies"
      className="pb-[var(--spacing-section-cta)] pt-[var(--spacing-section-md)]"
      style={{ background: "#f6f6f6" }}
      aria-labelledby="related-case-studies-title"
    >
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal header>
            <h2
              id="related-case-studies-title"
              className="font-display text-[#111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: "var(--fs-h2-weight)",
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
              }}
            >
              More from the library
            </h2>
          </Reveal>

          <Reveal delay={0.1} y={20} className="shrink-0">
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 font-sans font-medium text-[#4a3bf1] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
              style={{ fontSize: "var(--fs-body)" }}
            >
              All case studies
              <ArrowRightIcon />
            </Link>
          </Reveal>
        </div>

        <RevealStagger
          gap={0.08}
          className={`mt-10 grid grid-cols-1 justify-center justify-items-center gap-6 sm:grid-cols-2 lg:mt-12 lg:gap-8 ${columnClass}`}
        >
          {studies.map((study) => (
            <RevealItem key={study.id} className="flex w-full justify-center">
              <CaseStudyCard caseStudy={study} variant="compact" />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
