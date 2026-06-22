import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { mediaUrl } from "@/lib/blog";
import {
  getNewsBySlug,
  getNewsBySlugDraft,
  getNewsSlugs,
  getRelatedNews,
} from "@/lib/news";
import { highlightLexical } from "@/lib/highlightLexical";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { NewsDetailHero } from "@/components/sections/news-detail/NewsDetailHero";
import { NewsDetailBody } from "@/components/sections/news-detail/NewsDetailBody";
import { NewsDetailRelated } from "@/components/sections/news-detail/NewsDetailRelated";
import { NewsDetailCTA } from "@/components/sections/news-detail/NewsDetailCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { breadcrumbSchema, newsArticleSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph, seoOverride } from "@/lib/seo/compose-page";

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

/** Pre-render every published news item; degrade to on-demand if CMS is down at build. */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const slugs = await getNewsSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug).catch(() => null);
  if (!item) {
    return buildPageMetadata({
      title: "News",
      description: "CleanStart newsroom.",
      path: `/news/${slug}`,
      noindex: true,
    });
  }

  const heroAbsolute = mediaUrl(item.heroImage?.url ?? item.publisherLogo?.url);
  const seo = resolveCmsSeo(item.seo, { absolutize: mediaUrl });

  return buildPageMetadata({
    title: seo.title ?? item.title,
    description:
      seo.description ??
      item.abstract ??
      "Press release and announcements from CleanStart.",
    path: `/news/${item.slug}`,
    eyebrow: "News",
    type: "article",
    publishedTime: item.publicationDate ?? undefined,
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : heroAbsolute
        ? {
            image: {
              url: heroAbsolute,
              alt: item.title,
            },
          }
        : {}),
  });
}

export async function renderNewsDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const item = draft ? await getNewsBySlugDraft(slug) : await getNewsBySlug(slug);
  if (!item) notFound();

  const categoryIds = item.newsCategories?.map((c) => c.id) ?? [];
  const [related, highlightedBody] = await Promise.all([
    getRelatedNews(item.id, categoryIds, 3, { draft }).catch(() => []),
    highlightLexical(item.body ?? null),
  ]);
  const itemWithHighlighted = { ...item, body: highlightedBody ?? null };

  const heroAbsolute = mediaUrl(item.heroImage?.url ?? item.publisherLogo?.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com";
  const shareUrl = `${siteUrl}/news/${item.slug}`;

  return (
    <>
      <JsonLdGraph
        id={`news-jsonld-${item.slug}`}
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Newsroom", path: "/news" },
              { name: item.title },
            ]),
            newsArticleSchema({
              title: item.title,
              description: item.abstract ?? undefined,
              path: `/news/${item.slug}`,
              publishedAt: item.publicationDate ?? undefined,
              modifiedAt: item.updatedAt ?? undefined,
              imageUrl: heroAbsolute,
              section: item.pressType ?? undefined,
            }),
          ],
          override: seoOverride(item.seo),
        })}
      />
      <Header />
      <main id="main-content">
        <NewsDetailHero
          title={item.title}
          pressType={item.pressType}
          publicationDate={item.publicationDate}
          shareUrl={shareUrl}
          shareTitle={item.title}
        />

        <div className="bg-white">
          <NewsDetailBody item={itemWithHighlighted} />
        </div>

        {related.length > 0 ? (
          <div
            style={{
              background:
                "linear-gradient(180deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
              paddingBottom: "var(--spacing-section-cta)",
            }}
          >
            <NewsDetailRelated items={related} />
          </div>
        ) : (
          /* NewsDetailBody has internal pb-[80px] → spacer covers remainder
             via responsive token (440/210/190 at mobile/sm/lg). */
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 80px)" }} />
        )}

      </main>
      <Footer cta={<NewsDetailCTA />} />
    </>
  );
}

export default async function NewsDetailPage({
  params,
}: NewsDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderNewsDetail({ slug });
}
