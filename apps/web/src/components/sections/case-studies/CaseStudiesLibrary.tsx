import type React from "react";
import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRightIcon } from "./CaseStudyIcons";

/**
 * Section chrome for the full library: heading, intro, and the slot the
 * paginated cards render into.
 *
 * The header lives out here, outside the route's `<Suspense>` boundary, on
 * purpose. Streaming emits the fallback tree *and* the resolved tree into the
 * static HTML, so anything inside the boundary is duplicated in the source:
 * two `<h2>`s and two `id="customer-stories"` anchors. Only the cards vary
 * with the page param, so only the cards belong inside.
 *
 * No filter bar yet: with a single-digit number of studies, an industry
 * dropdown would return one card per option and make the library look emptier
 * than it is. `CaseStudiesBrowser` already reads its state from the URL, so
 * adding industry and product facets later is a control in this header and a
 * predicate in `selectCaseStudies` — no restructuring.
 */
export function CaseStudiesLibrary({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Section
      padding="md"
      data-section="CaseStudiesLibrary"
      style={{ background: "#f6f6f6" }}
      aria-labelledby="customer-stories-title"
    >
      <Container>
        <div
          id="customer-stories"
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          style={{ scrollMarginTop: "96px" }}
        >
          <Reveal header style={{ maxWidth: "640px" }}>
            <p
              className="font-sans uppercase text-[#4a3bf1]"
              style={{
                fontSize: "var(--fs-eyebrow)",
                fontWeight: "var(--fs-eyebrow-weight)",
                letterSpacing: "var(--fs-eyebrow-ls)",
                lineHeight: "var(--fs-eyebrow-lh)",
              }}
            >
              All customer stories
            </p>
            <h2
              id="customer-stories-title"
              className="mt-3 font-display text-[#111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: "var(--fs-h2-weight)",
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
              }}
            >
              Every engagement, in the customer&rsquo;s own terms
            </h2>
            <p
              className="mt-4 font-sans"
              style={{
                fontSize: "var(--fs-body)",
                lineHeight: "var(--fs-body-lh)",
                color: "rgba(17,17,17,0.62)",
              }}
            >
              Finance, healthcare, telecom and technology teams, each with the
              problem they started from and what changed after.
            </p>
          </Reveal>

          <Reveal delay={0.1} y={20} className="shrink-0">
            <Link
              href="/book-a-demo"
              className="inline-flex items-center gap-2 font-sans font-medium text-[#4a3bf1] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
              style={{ fontSize: "var(--fs-body)" }}
            >
              Ask for a story from your industry
              <ArrowRightIcon />
            </Link>
          </Reveal>
        </div>

        <div className="mt-10 lg:mt-12">{children}</div>
      </Container>
    </Section>
  );
}
