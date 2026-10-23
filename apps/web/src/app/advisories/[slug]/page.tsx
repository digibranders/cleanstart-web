import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAdvisoryBySlug,
  getAdvisoryBySlugDraft,
  getAdvisorySlugs,
  getRelatedAdvisories,
} from "@/lib/advisory";
import { mediaUrl } from "@/lib/blog";
import { ADVISORIES_SECTION } from "@/lib/blog-utils";
import { highlightLexical } from "@/lib/highlightLexical";
import { lexicalToPlainText } from "@/lib/renderLexical";
import { Header } from "@/components/nav/Header";
import { BlogDetailHero } from "@/components/sections/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/sections/blog/BlogDetailContent";
import { BlogDetailAuthor } from "@/components/sections/blog/BlogDetailAuthor";
import { BlogDetailFAQ } from "@/components/sections/blog/BlogDetailFAQ";
import { BlogDetailRelatedPosts } from "@/components/sections/blog/BlogDetailRelatedPosts";
import { BlogScrollReset } from "@/components/sections/blog/BlogScrollReset";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { Footer } from "@/components/sections/Footer";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { effectiveModifiedAt, effectivePublishedAt } from "@/lib/published-date";
import {
  articleSchema,
  breadcrumbSchema,
  breadcrumbTrail,
  faqPageSchema,
} from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph, seoOverride } from "@/lib/seo/compose-page";

interface AdvisoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

const { basePath } = ADVISORIES_SECTION;

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const slugs = await getAdvisorySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: AdvisoryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const advisory = await getAdvisoryBySlug(slug);
  if (!advisory) {
    return buildPageMetadata({
      title: "Security advisory",
      description: "CleanStart security advisory.",
      path: `${basePath}/${slug}`,
      noindex: true,
    });
  }

  const heroAbsolute = mediaUrl(advisory.heroImage?.url);
  const seo = resolveCmsSeo(advisory.seo, { absolutize: mediaUrl });

  return buildPageMetadata({
    title: seo.title ?? advisory.title,
    description:
      seo.description ??
      advisory.abstract ??
      "A CleanStart security advisory: what is affected and how to fix it.",
    path: `${basePath}/${advisory.slug}`,
    eyebrow: "Advisory",
    type: "article",
    publishedTime: effectivePublishedAt(advisory) ?? advisory.publishedAt,
    modifiedTime: effectiveModifiedAt(advisory),
    authors: advisory.authors?.map((a) => a.name),
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : heroAbsolute && advisory.heroImage
        ? {
            image: {
              url: heroAbsolute,
              width: advisory.heroImage.width,
              height: advisory.heroImage.height,
              alt: advisory.heroImage.alt ?? advisory.title,
            },
          }
        : {}),
  });
}

export async function renderAdvisoryDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const advisory = draft ? await getAdvisoryBySlugDraft(slug) : await getAdvisoryBySlug(slug);

  if (!advisory) notFound();

  const publishedAt = effectivePublishedAt(advisory);
  const [related, highlightedBody] = await Promise.all([
    getRelatedAdvisories(String(advisory.id), { draft }).catch(() => []),
    highlightLexical(advisory.body),
  ]);

  // One filtered array feeds both the FAQPage JSON-LD and the accordion, so
  // the visible content always matches the schema.
  const validFaqs = (advisory.faqs ?? []).filter(
    (faq) => (faq.question?.trim().length ?? 0) > 0 && lexicalToPlainText(faq.answer).length > 0,
  );

  return (
    <>
      <BlogScrollReset />
      <JsonLdGraph
        id={`advisory-jsonld-${advisory.slug}`}
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema(breadcrumbTrail("advisory", { title: advisory.title })),
            articleSchema({
              title: advisory.title,
              description: advisory.abstract ?? undefined,
              path: `${basePath}/${advisory.slug}`,
              publishedAt,
              modifiedAt: effectiveModifiedAt(advisory),
              imageUrl: mediaUrl(advisory.heroImage?.url),
              type: "Security advisory",
              authors: advisory.authors?.map((a) => ({ name: a.name, slug: a.slug })),
            }),
            ...(validFaqs.length > 0
              ? [
                  faqPageSchema(
                    validFaqs.map((faq) => ({
                      question: faq.question.trim(),
                      answer: lexicalToPlainText(faq.answer),
                    })),
                  ),
                ]
              : []),
          ],
          override: seoOverride(advisory.seo),
        })}
      />
      <Header />
      <main id="main-content">
        <BlogDetailHero
          title={advisory.title}
          slug={advisory.slug}
          authors={advisory.authors}
          publishedAt={publishedAt}
          updatedAt={advisory.contentUpdatedAt ?? undefined}
          readingMinutes={advisory.readingMinutes ?? undefined}
          heroImage={advisory.heroImage}
          section={ADVISORIES_SECTION}
        />

        <BlogDetailContent
          body={highlightedBody}
          tableOfContents={advisory.tableOfContents}
          heroImage={advisory.heroImage}
        />

        <BlogDetailAuthor authors={advisory.authors} />

        {validFaqs.length > 0 && <BlogDetailFAQ faqs={validFaqs} />}

        {/* Same CTA clearance as the blog article: each branch subtracts the
            bottom padding of the last section it follows. */}
        {related.length > 0 ? (
          <div
            style={{
              background: "linear-gradient(180deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
              paddingBottom: "calc(var(--spacing-section-cta) - 20px)",
            }}
          >
            <BlogDetailRelatedPosts posts={related} section={ADVISORIES_SECTION} />
          </div>
        ) : validFaqs.length > 0 ? (
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 80px)" }} />
        ) : (
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 64px)" }} />
        )}
      </main>

      <Footer cta={<BlogDetailCTA />} />
    </>
  );
}

export default async function AdvisoryDetailPage({
  params,
}: AdvisoryDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderAdvisoryDetail({ slug });
}
