import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CardCoverFallback } from "@/components/ui/CardCoverFallback";
import { Reveal } from "@/components/ui/Reveal";
import { caseStudyQuote } from "@/components/sections/case-study/case-study-quote";
import type { CaseStudy } from "@/lib/case-studies";
import {
  caseStudyPath,
  formatFileMeta,
  mediaUrl,
  resolveIndustryLabel,
  summaryLead,
} from "@/lib/case-studies-utils";
import { DownloadIcon } from "./CaseStudyIcons";

/**
 * The newest published case study, given the page's one large slot.
 *
 * Which study lands here is the route's decision: the one an editor ticked
 * `featured` on, or the newest published study when nobody has. This component
 * just renders whichever it is given.
 *
 * The right half carries the customer's approved quote when the study has one,
 * so the featured slot has a voice and not just a summary. A study without one
 * falls back to the cover image alone.
 */

export function FeaturedCaseStudy({
  caseStudy,
}: {
  caseStudy: CaseStudy;
}): React.ReactElement {
  const coverSrc = mediaUrl(caseStudy.coverImage?.url);
  const logoSrc = mediaUrl(caseStudy.companyLogo?.url);
  const downloadHref = mediaUrl(caseStudy.asset?.url);
  const fileMeta = formatFileMeta(caseStudy.asset);
  const industry = resolveIndustryLabel(caseStudy);
  const lead = summaryLead(caseStudy.summary);
  const quote = caseStudyQuote(caseStudy);

  return (
    <Section
      padding="md"
      data-section="FeaturedCaseStudy"
      style={{ background: "#f6f6f6" }}
      aria-labelledby="featured-case-study-title"
    >
      <Container>
        <Reveal header>
          <p
            className="font-sans uppercase text-[#4a3bf1]"
            style={{
              fontSize: "var(--fs-eyebrow)",
              fontWeight: "var(--fs-eyebrow-weight)",
              letterSpacing: "var(--fs-eyebrow-ls)",
              lineHeight: "var(--fs-eyebrow-lh)",
            }}
          >
            Featured story
          </p>
          <h2
            id="featured-case-study-title"
            className="mt-3 font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: "var(--fs-h2-weight)",
              letterSpacing: "var(--fs-h2-ls)",
              lineHeight: "var(--fs-h2-lh)",
              maxWidth: "760px",
            }}
          >
            The most recent engagement, start to finish
          </h2>
        </Reveal>

        <Reveal delay={0.1} y={28} className="mt-8 lg:mt-10">
          <article
            className="grid grid-cols-1 overflow-hidden bg-white lg:grid-cols-[1.05fr_0.95fr]"
            style={{
              borderRadius: "32px",
              boxShadow:
                "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01)",
            }}
          >
            {/* Content half. */}
            <div className="flex flex-col justify-between gap-8 p-7 sm:p-10 lg:p-12">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-4">
                  {industry && <CategoryBadge label={industry} />}
                  <div className="flex items-center gap-2">
                    {logoSrc && (
                      <Image
                        src={logoSrc}
                        alt=""
                        width={24}
                        height={24}
                        sizes="24px"
                        className="object-contain"
                        style={{ height: "24px", width: "auto", maxWidth: "36px" }}
                      />
                    )}
                    <span
                      className="font-sans font-medium text-[#666]"
                      style={{ fontSize: "var(--fs-body-sm)" }}
                    >
                      {caseStudy.company}
                    </span>
                  </div>
                </div>

                <h3
                  className="font-display text-[#111]"
                  style={{
                    fontSize: "var(--fs-h3)",
                    fontWeight: "var(--fs-h3-weight)",
                    letterSpacing: "var(--fs-h3-ls)",
                    lineHeight: "var(--fs-h3-lh)",
                  }}
                >
                  {caseStudy.title}
                </h3>

                {lead && (
                  <p
                    className="font-sans"
                    style={{
                      fontSize: "var(--fs-body)",
                      lineHeight: "var(--fs-body-lh)",
                      color: "rgba(17,17,17,0.62)",
                      maxWidth: "52ch",
                    }}
                  >
                    {lead}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href={caseStudyPath(caseStudy.slug)}
                  className="cs-btn-blue"
                  style={
                    {
                      "--cs-btn-fs": "16px",
                      "--cs-btn-h": "44px",
                      "--cs-btn-px": "22px",
                    } as React.CSSProperties
                  }
                >
                  Read the full story
                </Link>
                {downloadHref && (
                  <a
                    href={downloadHref}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-sans font-medium text-[#4a3bf1] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
                    style={{ fontSize: "var(--fs-body-sm)" }}
                    aria-label={`Download ${caseStudy.title} (${fileMeta ?? "file"})`}
                  >
                    <DownloadIcon />
                    <span>Download the PDF</span>
                    {fileMeta && (
                      <span className="font-normal text-[#666]">({fileMeta})</span>
                    )}
                  </a>
                )}
              </div>
            </div>

            {/* Cover half, with the customer's own words when we have them. */}
            <div className="relative min-h-[260px] overflow-hidden lg:min-h-[420px]">
              {coverSrc ? (
                <Image
                  src={coverSrc}
                  alt={caseStudy.coverImage?.alt ?? caseStudy.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 45vw, 100vw"
                />
              ) : (
                <CardCoverFallback />
              )}

              {quote && (
                <>
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(21,16,33,0.15) 0%, rgba(21,16,33,0.62) 48%, rgba(21,16,33,0.9) 100%)",
                    }}
                  />
                  <figure className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-7 sm:p-9">
                    <blockquote
                      className="font-display font-medium text-white"
                      style={{
                        fontSize: "var(--fs-lead-sm)",
                        lineHeight: 1.35,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      &ldquo;{quote.text}&rdquo;
                    </blockquote>
                    <figcaption
                      className="font-sans text-white/70"
                      style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.45 }}
                    >
                      {quote.author && (
                        <span className="font-medium text-white">{quote.author}</span>
                      )}
                      {quote.role && <span className="block">{quote.role}</span>}
                    </figcaption>
                  </figure>
                </>
              )}
            </div>
          </article>
        </Reveal>
      </Container>
    </Section>
  );
}
