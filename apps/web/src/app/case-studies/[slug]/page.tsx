import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { CaseStudiesCTA } from "@/components/sections/case-studies/CaseStudiesCTA";
import { CaseStudyBody } from "@/components/sections/case-study/CaseStudyBody";
import { CaseStudyHero } from "@/components/sections/case-study/CaseStudyHero";
import { CaseStudyQuote } from "@/components/sections/case-study/CaseStudyQuote";
import { RelatedCaseStudies } from "@/components/sections/case-study/RelatedCaseStudies";
import { caseStudyQuote } from "@/components/sections/case-study/case-study-quote";
import { FadeUp } from "@/components/ui/FadeUp";
import {
  getCaseStudies,
  getCaseStudyBySlug,
  getCaseStudySlugs,
  type CaseStudyGlanceFact,
} from "@/lib/case-studies";
import {
  formatFileMeta,
  mediaUrl,
  resolveIndustryLabel,
  summaryLead,
} from "@/lib/case-studies-utils";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";

/**
 * A single case study.
 *
 * Shape: the claim and the evidence side by side (hero) → the facts rail and
 * the narrative → the customer's voice → where to read next → the ask.
 *
 * The page adapts to how much a study actually publishes rather than assuming
 * a rich document. A study with `outcomes` gets a result card in the hero and
 * its quote in a band of its own; a study with only a quote puts that in the
 * card; a study with neither drops to a centred single-column hero. Same for
 * `body`: present, it is the article; absent, the column points at the PDF.
 * Nothing here pads itself out to fill a template.
 *
 * Indexable, with `seo.indexable` per document: an editor can hold a study
 * back from search without unpublishing it. The route is in the sitemap.
 */

export const revalidate = 21600; // 6h ISR fallback — publish revalidation keeps this fresh

const RELATED_LIMIT = 3;

function formatPublished(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getCaseStudySlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await getCaseStudyBySlug(slug).catch(() => null);
  if (!caseStudy) {
    return buildPageMetadata({
      title: "Case study",
      description: "CleanStart customer case study.",
      path: `/case-studies/${slug}`,
      noindex: true,
    });
  }
  const seo = resolveCmsSeo(caseStudy.seo, { absolutize: mediaUrl });
  const coverAbsolute = mediaUrl(caseStudy.coverImage?.url);

  return buildPageMetadata({
    title: seo.title ?? caseStudy.title,
    description:
      seo.description ??
      summaryLead(caseStudy.summary).slice(0, 200) ??
      "CleanStart customer case study.",
    path: `/case-studies/${caseStudy.slug}`,
    eyebrow: "Case Study",
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : coverAbsolute && caseStudy.coverImage
        ? {
            image: {
              url: coverAbsolute,
              width: caseStudy.coverImage.width,
              height: caseStudy.coverImage.height,
              alt: caseStudy.coverImage.alt ?? caseStudy.title,
            },
          }
        : {}),
  });
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;

  const [caseStudy, all] = await Promise.all([
    getCaseStudyBySlug(slug).catch(() => null),
    getCaseStudies({ limit: 1000 })
      .then((r) => r.docs)
      .catch(() => []),
  ]);
  if (!caseStudy) notFound();

  const industry = resolveIndustryLabel(caseStudy);
  const downloadHref = mediaUrl(caseStudy.asset?.url);
  const fileMeta = formatFileMeta(caseStudy.asset);
  const logoSrc = mediaUrl(caseStudy.companyLogo?.url);
  const publishedLabel = formatPublished(caseStudy.publishedAt);

  const outcomes = caseStudy.outcomes ?? [];
  const quote = caseStudyQuote(caseStudy);
  // The quote lives in exactly one place. It fills the hero card when a study
  // has no figures to put there, and otherwise gets its own band lower down.
  const hasOutcomes = outcomes.length > 0;
  const quoteInCard = !hasOutcomes && quote !== undefined;

  // Editors write `summary` as a third-person rendering of the same quote —
  // IIFL's and Aurascape's are that sentence with the pronouns swapped — so
  // running it as the standfirst beside that quote prints the claim twice in
  // one screen. When the card holds the quote, the hero drops the standfirst.
  const standfirst = quoteInCard ? "" : summaryLead(caseStudy.summary);

  const facts: CaseStudyGlanceFact[] = [
    { label: "Company", value: caseStudy.company },
    ...(industry ? [{ label: "Industry", value: industry }] : []),
    ...(caseStudy.glance ?? []),
    ...(publishedLabel ? [{ label: "Published", value: publishedLabel }] : []),
  ];

  // Same industry first, then the rest by recency (the API already sorts).
  const related = all
    .filter((s) => s.slug !== caseStudy.slug)
    .sort((a, b) => {
      const aMatch = resolveIndustryLabel(a) === industry ? 0 : 1;
      const bMatch = resolveIndustryLabel(b) === industry ? 0 : 1;
      return aMatch - bMatch;
    })
    .slice(0, RELATED_LIMIT);

  return (
    <>
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <CaseStudyHero
          title={caseStudy.title}
          company={caseStudy.company}
          industry={industry}
          logoSrc={logoSrc}
          standfirst={standfirst}
          publishedLabel={publishedLabel}
          downloadHref={downloadHref}
          fileMeta={fileMeta}
          outcomes={outcomes}
          quote={quoteInCard ? quote : undefined}
        />

        <FadeUp>
          <CaseStudyBody
            facts={facts}
            body={caseStudy.body}
            downloadHref={downloadHref}
            fileMeta={fileMeta}
          />
        </FadeUp>

        {hasOutcomes && quote && (
          <FadeUp>
            <CaseStudyQuote quote={quote} />
          </FadeUp>
        )}

        <FadeUp>
          <RelatedCaseStudies studies={related} />
        </FadeUp>
      </main>
      <Footer cta={<CaseStudiesCTA />} />
    </>
  );
}
