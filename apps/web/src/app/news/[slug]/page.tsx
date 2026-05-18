import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { mediaUrl } from "@/lib/blog";
import {
  getNewsBySlug,
  getNewsBySlugDraft,
  getRelatedNews,
} from "@/lib/news";
import { highlightLexical } from "@/lib/highlightLexical";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { NewsDetailHero } from "@/components/sections/news-detail/NewsDetailHero";
import { NewsDetailBody } from "@/components/sections/news-detail/NewsDetailBody";
import { NewsDetailRelated } from "@/components/sections/news-detail/NewsDetailRelated";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, articleSchema, breadcrumbSchema } from "@/lib/seo/jsonld";

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
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

  return buildPageMetadata({
    title: item.title,
    description:
      item.abstract ??
      "Press release and announcements from CleanStart.",
    path: `/news/${item.slug}`,
    type: "article",
    publishedTime: item.publicationDate ?? undefined,
    ...(heroAbsolute
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
      <JsonLd
        id={`news-breadcrumbs-${item.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Newsroom", path: "/news" },
          { name: item.title },
        ])}
      />
      <JsonLd
        id={`news-article-${item.slug}`}
        data={articleSchema({
          title: item.title,
          description: item.abstract ?? undefined,
          path: `/news/${item.slug}`,
          publishedAt: item.publicationDate ?? undefined,
          imageUrl: heroAbsolute,
          type: "NewsArticle",
        })}
      />
      <Header />
      <main>
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
              paddingBottom: "250px",
            }}
          >
            <NewsDetailRelated items={related} />
          </div>
        ) : (
          /* NewsDetailBody has internal pb-[80px] → spacer covers remaining 170 */
          <div aria-hidden className="bg-white" style={{ height: "170px" }} />
        )}

      </main>
      <Footer cta={<BlogDetailCTA />} />
    </>
  );
}

export default async function NewsDetailPage({
  params,
}: NewsDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderNewsDetail({ slug });
}
