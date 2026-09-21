import type React from "react";
import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import type { Resource } from "@/lib/resources";
import { resourceTypeLabel } from "@/lib/resources-utils";
import { ArrowRightIcon } from "./CaseStudyIcons";
import { CASE_STUDY_RESOURCES } from "./case-studies-resources";

/**
 * Small document mark for the rail.
 *
 * The resource-centre cover posters are portrait artwork sized for a full card
 * top; shrunk to a 76px thumbnail they read as a dark smudge. A single
 * on-brand glyph is legible at this size, and the type label beside it already
 * does the work of telling whitepaper from datasheet.
 */
function DocumentTile(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="grid shrink-0 place-items-center"
      style={{
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: "linear-gradient(145deg, #efeaff 0%, #e2f4fb 100%)",
        border: "1px solid rgba(74,59,241,0.12)",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 3.5h7.5L18.5 8.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z"
          stroke="#4a3bf1"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M13.25 3.75V9h5" stroke="#4a3bf1" strokeWidth="1.5" strokeLinejoin="round" />
        <path
          d="M8.5 12.5h7M8.5 15.5h7M8.5 18h4"
          stroke="#33BAEC"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Curated resource rail. `resources` is whatever `getResourcesBySlugs`
 * resolved; the blurb and ordering come from `CASE_STUDY_RESOURCES`, so a
 * resource that is unpublished simply leaves the rail.
 */
export function CaseStudiesResources({
  resources,
}: {
  resources: readonly Resource[];
}): React.ReactElement | null {
  const cards = resources
    .map((resource) => {
      const curated = CASE_STUDY_RESOURCES.find((c) => c.slug === resource.slug);
      if (!curated) return null;
      return {
        slug: resource.slug,
        title: resource.title || curated.fallbackTitle,
        type: resource.type ?? curated.fallbackType,
        blurb: curated.blurb,
        gated: Boolean(resource.gated),
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  if (cards.length === 0) return null;

  return (
    <Section
      padding="md"
      data-section="CaseStudiesResources"
      style={{ background: "#f6f6f6" }}
      aria-labelledby="case-studies-resources-title"
    >
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
              Keep reading
            </p>
            <h2
              id="case-studies-resources-title"
              className="mt-3 font-display text-[#111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: "var(--fs-h2-weight)",
                letterSpacing: "var(--fs-h2-ls)",
                lineHeight: "var(--fs-h2-lh)",
              }}
            >
              The reading that goes with these stories
            </h2>
          </Reveal>

          <Reveal delay={0.1} y={20} className="shrink-0">
            <Link
              href="/resource-center"
              className="inline-flex items-center gap-2 font-sans font-medium text-[#4a3bf1] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
              style={{ fontSize: "var(--fs-body)" }}
            >
              Browse the resource center
              <ArrowRightIcon />
            </Link>
          </Reveal>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-12 lg:gap-6">
          {cards.map((card, i) => (
            <Reveal key={card.slug} delay={0.06 * i} y={24}>
              <Link
                href={`/resources/${card.slug}`}
                className="group flex h-full items-start gap-5 bg-white p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33BAEC] motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
                style={{
                  borderRadius: "24px",
                  boxShadow:
                    "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01)",
                }}
              >
                <DocumentTile />

                <div className="flex min-w-0 flex-col gap-2">
                  <span
                    className="font-sans font-medium uppercase text-[#4a3bf1]"
                    style={{
                      fontSize: "var(--fs-caption)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {resourceTypeLabel(card.type)}
                    {card.gated && <span className="text-[#666]"> &middot; Free, one form</span>}
                  </span>

                  <h3
                    className="font-display text-[#111]"
                    style={{
                      fontSize: "var(--fs-h5)",
                      fontWeight: "var(--fs-h5-weight)",
                      letterSpacing: "var(--fs-h5-ls)",
                      lineHeight: 1.3,
                    }}
                  >
                    {card.title}
                  </h3>

                  <p
                    className="font-sans"
                    style={{
                      fontSize: "var(--fs-body-sm)",
                      lineHeight: 1.5,
                      color: "rgba(17,17,17,0.58)",
                    }}
                  >
                    {card.blurb}
                  </p>

                  <span
                    aria-hidden
                    className="mt-1 inline-flex items-center gap-2 font-sans font-medium text-[#4a3bf1]"
                    style={{ fontSize: "var(--fs-body-sm)" }}
                  >
                    Read it
                    <span className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none">
                      <ArrowRightIcon size={14} />
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
