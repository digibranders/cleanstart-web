import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { GuideScrollReset } from "@/components/sections/guide/GuideScrollReset";
import { GuideDetailHero } from "@/components/sections/guide/GuideDetailHero";
import { GuideDetailContent } from "@/components/sections/guide/GuideDetailContent";
import { GuideDetailAuthor } from "@/components/sections/guide/GuideDetailAuthor";
import { GuideDetailJourneyNav } from "@/components/sections/guide/GuideDetailJourneyNav";
import type { GuideJourneyNavTarget } from "@/components/sections/guide/GuideDetailJourneyNav";
import { GuideDetailFAQ } from "@/components/sections/guide/GuideDetailFAQ";
import { GuideDetailRelatedGuides } from "@/components/sections/guide/GuideDetailRelatedGuides";
import { GuidesCTA } from "@/components/sections/guides/GuidesCTA";
import { highlightLexical } from "@/lib/highlightLexical";
import { lexicalToPlainText } from "@/lib/renderLexical";
import {
  getGuideBySlug,
  getGuideBySlugDraft,
  getGuideSlugs,
  getRelatedGuides,
  getGuideJourneyTargets,
  guideMediaUrl,
} from "@/lib/guides";
import type { Guide } from "@/lib/guides";
import { guideCoverKeyword, guideCoverPath } from "@/lib/guide-cover";
import { effectivePublishedAt } from "@/lib/published-date";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import {
  articleSchema,
  breadcrumbSchema,
  breadcrumbTrail,
  faqPageSchema,
} from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph, seoOverride } from "@/lib/seo/compose-page";

interface GuideDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

/** Pre-render every published guide; degrade to on-demand if CMS is down at build. */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const slugs = await getGuideSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug).catch(() => null);
  if (!guide) {
    return buildPageMetadata({
      title: "Guide",
      description: "CleanStart guide.",
      path: `/guide/${slug}`,
      noindex: true,
    });
  }

  const seo = resolveCmsSeo(guide.seo, { absolutize: guideMediaUrl });
  // Guides have no uploaded hero image — the social card is the branded,
  // per-guide generated cover (1200×630), unless the editor set an explicit
  // SEO image override.
  const coverImageUrl = absoluteUrl(guideCoverPath(guideCoverKeyword(guide)));

  return buildPageMetadata({
    title: seo.title ?? guide.title,
    eyebrow: "Guide",
    description:
      seo.description ??
      guide.abstract ??
      "In-depth guides on container security, compliance, and software supply-chain integrity from CleanStart.",
    path: `/guide/${guide.slug}`,
    type: "article",
    publishedTime: effectivePublishedAt(guide) ?? guide.publishedAt ?? undefined,
    modifiedTime: guide.updatedAt ?? undefined,
    authors: guide.authors?.map((a) => a.name),
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    image: seo.image ?? {
      url: coverImageUrl,
      width: 1200,
      height: 630,
      alt: guide.title,
    },
  });
}

export async function renderGuideDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const guide = draft
    ? await getGuideBySlugDraft(slug).catch(() => null)
    : await getGuideBySlug(slug).catch(() => null);
  if (!guide) notFound();

  const publishedAt = effectivePublishedAt(guide);

  // Editorial picks win; missing sides fall back to chronological neighbors.
  // The auto fetch is skipped entirely when both sides are manually pinned.
  const manualPrevious = toGuideJourneyTarget(guide.previousGuide);
  const manualNext = toGuideJourneyTarget(guide.nextGuide);
  const needAutoJourney = !manualPrevious || !manualNext;

  const [relatedGuides, highlightedBody, autoJourney] = await Promise.all([
    getRelatedGuides(String(guide.id), guide.relatedGuides, { draft }),
    highlightLexical(guide.body ?? null),
    needAutoJourney
      ? getGuideJourneyTargets(String(guide.id), publishedAt ?? undefined, { draft })
      : Promise.resolve({ previous: null, next: null }),
  ]);

  const previousTarget = manualPrevious ?? toGuideJourneyTarget(autoJourney.previous);
  const nextTarget = manualNext ?? toGuideJourneyTarget(autoJourney.next);

  const coverImageUrl = absoluteUrl(guideCoverPath(guideCoverKeyword(guide)));
  const faqs = (guide.faqs ?? []).filter((f) => f.question && f.answer);

  return (
    <>
      <GuideScrollReset />
      {previousTarget ? (
        <link rel="prev" href={absoluteUrl(`/guide/${previousTarget.slug}`)} />
      ) : null}
      {nextTarget ? (
        <link rel="next" href={absoluteUrl(`/guide/${nextTarget.slug}`)} />
      ) : null}
      <JsonLdGraph
        id={`guide-jsonld-${guide.slug}`}
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema(breadcrumbTrail("guide", { title: guide.title })),
            articleSchema({
              title: guide.title,
              description: guide.abstract ?? undefined,
              path: `/guide/${guide.slug}`,
              publishedAt: publishedAt ?? guide.publishedAt ?? undefined,
              modifiedAt: guide.updatedAt ?? undefined,
              imageUrl: coverImageUrl,
              authors: guide.authors?.map((a) => ({ name: a.name, slug: a.slug })),
            }),
            ...(faqs.length > 0
              ? [faqPageSchema(faqs.map((f) => ({ question: f.question, answer: lexicalToPlainText(f.answer) })))]
              : []),
          ],
          override: seoOverride(guide.seo),
        })}
      />
      <Header />
      <main id="main-content">
        <GuideDetailHero
          title={guide.title}
          slug={guide.slug}
          authors={guide.authors}
          publishedAt={publishedAt ?? undefined}
          updatedAt={guide.updatedAt ?? undefined}
          readingMinutes={guide.readingMinutes ?? undefined}
        />

        <GuideDetailContent
          body={highlightedBody}
          tableOfContents={guide.tableOfContents}
        />

        {faqs.length > 0 ? <GuideDetailFAQ faqs={faqs} /> : null}

        <GuideDetailAuthor authors={guide.authors} />

        <GuideDetailJourneyNav previous={previousTarget} next={nextTarget} />

        {/* Trailing buffer keeps a consistent gap before the CTA card.
            `--spacing-section-cta` holds the per-breakpoint clearance; each
            branch subtracts the inner pb of the last rendered section, in the
            section order: Content → FAQ → Author → Journey. */}
        {relatedGuides.length > 0 ? (
          <div
            style={{
              background:
                "linear-gradient(180deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
              paddingBottom: "calc(var(--spacing-section-cta) - 20px)",
            }}
          >
            <GuideDetailRelatedGuides guides={relatedGuides} />
          </div>
        ) : previousTarget || nextTarget ? (
          /* JourneyNav (py-6/8 → 32px bottom) is last. */
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 32px)" }} />
        ) : guide.authors && guide.authors.length > 0 ? (
          /* Author (pb-16 → 64px) is last. */
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 64px)" }} />
        ) : faqs.length > 0 ? (
          /* FAQ (pb-20 → 80px) is last. */
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 80px)" }} />
        ) : (
          /* Content (pb-28 → 112px) is last. */
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 112px)" }} />
        )}
      </main>
      <Footer cta={<GuidesCTA />} />
    </>
  );
}

export default async function GuideDetailPage({
  params,
}: GuideDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderGuideDetail({ slug });
}

/**
 * Normalize a Payload relationship value (id or hydrated doc) into a
 * GuideJourneyNavTarget. Returns null when unset, a bare id (cannot render
 * without a title), or missing slug/title.
 */
function toGuideJourneyTarget(
  value: Guide | string | number | null | undefined,
): GuideJourneyNavTarget | null {
  if (value == null) return null;
  if (typeof value !== "object") return null;
  if (!value.slug || !value.title) return null;
  return { slug: value.slug, title: value.title };
}
