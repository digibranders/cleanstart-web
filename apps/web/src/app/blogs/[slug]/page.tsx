import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAutoJourneyTargets,
  getBlogBySlug,
  getBlogBySlugDraft,
  getBlogSlugs,
  getRelatedBlogs,
  mediaUrl,
} from "@/lib/blog";
import type { Blog } from "@/lib/blog";
import { highlightLexical } from "@/lib/highlightLexical";
import { Header } from "@/components/nav/Header";
import { BlogDetailHero } from "@/components/sections/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/sections/blog/BlogDetailContent";
import { BlogDetailAuthor } from "@/components/sections/blog/BlogDetailAuthor";
import { BlogDetailFAQ } from "@/components/sections/blog/BlogDetailFAQ";
import { BlogDetailRelatedPosts } from "@/components/sections/blog/BlogDetailRelatedPosts";
import { BlogDetailJourneyNav } from "@/components/sections/blog/BlogDetailJourneyNav";
import type { JourneyNavTarget } from "@/components/sections/blog/BlogDetailJourneyNav";
import { BlogScrollReset } from "@/components/sections/blog/BlogScrollReset";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { Footer } from "@/components/sections/Footer";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { effectivePublishedAt } from "@/lib/published-date";
import {
  JsonLd,
  blogPostingSchema,
  breadcrumbSchema,
  faqPageSchema,
} from "@/lib/seo/jsonld";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

/**
 * Pre-render every published blog at build time so navigation is a static
 * cache hit instead of a live CMS render. A build-time CMS outage degrades
 * gracefully to on-demand rendering (returns []) rather than failing the build.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const slugs = await getBlogSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug).catch(() => null);
  if (!post) {
    return buildPageMetadata({
      title: "Blog post",
      description: "CleanStart blog post.",
      path: `/blogs/${slug}`,
      noindex: true,
    });
  }

  const heroAbsolute = mediaUrl(post.heroImage?.url);
  const seo = resolveCmsSeo(post.seo, { absolutize: mediaUrl });

  return buildPageMetadata({
    title: seo.title ?? post.title,
    description:
      seo.description ??
      post.abstract ??
      "Insights and writings from the CleanStart team on container security, DevOps, and compliance.",
    path: `/blogs/${post.slug}`,
    eyebrow: post.categories?.name ?? "Blog",
    type: "article",
    publishedTime: effectivePublishedAt(post) ?? post.publishedAt,
    modifiedTime: post.updatedAt,
    authors: post.authors?.map((a) => a.name), // metadata authors (plain string[])
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : heroAbsolute && post.heroImage
        ? {
            image: {
              url: heroAbsolute,
              width: post.heroImage.width,
              height: post.heroImage.height,
              alt: post.heroImage.alt ?? post.title,
            },
          }
        : {}),
  });
}

export async function renderBlogDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const post = draft ? await getBlogBySlugDraft(slug) : await getBlogBySlug(slug);

  if (!post) notFound();

  const categoryIds = post.categories ? [post.categories.id] : [];
  const publishedAt = effectivePublishedAt(post);

  // Editorial picks win when set; missing sides fall back to chronological
  // neighbors (same category preferred, then site-wide). Auto fetch is skipped
  // entirely when both sides are manually pinned to avoid wasted round-trips.
  const manualPrevious = toJourneyTarget(post.previousPost);
  const manualNext = toJourneyTarget(post.nextPost);
  const needAutoJourney = !manualPrevious || !manualNext;

  const [relatedPosts, highlightedBody, autoJourney] = await Promise.all([
    getRelatedBlogs(post.id, categoryIds, post.relatedPosts, { draft }),
    highlightLexical(post.body),
    needAutoJourney
      ? getAutoJourneyTargets(
          String(post.id),
          publishedAt ?? undefined,
          categoryIds,
          { draft },
        )
      : Promise.resolve({ previous: null, next: null }),
  ]);

  const previousTarget = manualPrevious ?? toJourneyTarget(autoJourney.previous);
  const nextTarget = manualNext ?? toJourneyTarget(autoJourney.next);

  const heroAbsolute = mediaUrl(post.heroImage?.url);
  const faqs = (post.faqs ?? []).filter((f) => f.question && f.answer);
  const journeyLinks = [
    ...(previousTarget ? [`/blogs/${previousTarget.slug}`] : []),
    ...(nextTarget ? [`/blogs/${nextTarget.slug}`] : []),
  ];

  return (
    <>
      <BlogScrollReset />
      {previousTarget ? (
        <link rel="prev" href={absoluteUrl(`/blogs/${previousTarget.slug}`)} />
      ) : null}
      {nextTarget ? (
        <link rel="next" href={absoluteUrl(`/blogs/${nextTarget.slug}`)} />
      ) : null}
      <JsonLd
        id={`blog-breadcrumbs-${post.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blogs", path: "/blogs" },
          { name: post.title },
        ])}
      />
      <JsonLd
        id={`blog-posting-${post.slug}`}
        data={blogPostingSchema({
          title: post.title,
          description: post.abstract ?? undefined,
          path: `/blogs/${post.slug}`,
          publishedAt,
          modifiedAt: post.updatedAt,
          imageUrl: heroAbsolute,
          authors: post.authors?.map((a) => ({ name: a.name, slug: a.slug })),
          category: post.categories?.name,
          relatedLinks: journeyLinks.length > 0 ? journeyLinks : undefined,
        })}
      />
      {faqs.length > 0 ? (
        <JsonLd
          id={`blog-faq-${post.slug}`}
          data={faqPageSchema(
            faqs.map((f) => ({ question: f.question, answer: f.answer })),
          )}
        />
      ) : null}
      <Header />
      <main id="main-content">
        <BlogDetailHero
          title={post.title}
          slug={post.slug}
          categories={post.categories}
          authors={post.authors}
          publishedAt={publishedAt}
          updatedAt={post.updatedAt ?? undefined}
          readingMinutes={post.readingMinutes ?? undefined}
          heroImage={post.heroImage}
        />

        <BlogDetailContent
          body={highlightedBody}
          tableOfContents={post.tableOfContents}
          heroImage={post.heroImage}
          abstract={post.abstract ?? undefined}
        />

        <BlogDetailAuthor authors={post.authors} />

        <BlogDetailJourneyNav previous={previousTarget} next={nextTarget} />

        {post.faqs && post.faqs.length > 0 && (
          <BlogDetailFAQ faqs={post.faqs} />
        )}

        {/* Trailing buffer keeps a consistent gap between the last section and
            the CTA card. `--spacing-section-cta` holds the per-breakpoint clearance;
            each branch subtracts the inner pb of its last rendered section. */}
        {relatedPosts.length > 0 ? (
          <div style={{ background: "linear-gradient(180deg, #151021 0%, #131E8F 62%, #471EC0 100%)", paddingBottom: "calc(var(--spacing-section-cta) - 20px)" }}>
            <BlogDetailRelatedPosts posts={relatedPosts} />
          </div>
        ) : post.faqs && post.faqs.length > 0 ? (
          /* FAQ section already has pb-20 (80px) → spacer covers remainder */
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 80px)" }} />
        ) : previousTarget || nextTarget ? (
          /* JourneyNav has py-10/12 (40/48px) bottom → spacer covers remainder */
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 50px)" }} />
        ) : (
          /* Author section has internal pb-16 (64px) → spacer covers remainder */
          <div aria-hidden className="bg-white" style={{ height: "calc(var(--spacing-section-cta) - 64px)" }} />
        )}

      </main>

      <Footer cta={<BlogDetailCTA />} />
    </>
  );
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderBlogDetail({ slug });
}

/**
 * Normalize a Payload relationship field (string/number id or hydrated doc) into
 * a JourneyNavTarget. Returns null when the field is unset, a bare id (cannot
 * render without title), or missing a slug/title.
 */
function toJourneyTarget(
  value: Blog | string | number | null | undefined,
): JourneyNavTarget | null {
  if (value == null) return null;
  if (typeof value !== "object") return null;
  if (!value.slug || !value.title) return null;
  return { slug: value.slug, title: value.title };
}
