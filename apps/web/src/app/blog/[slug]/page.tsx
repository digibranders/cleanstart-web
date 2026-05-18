import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getBlogBySlug,
  getBlogBySlugDraft,
  getRelatedBlogs,
  mediaUrl,
} from "@/lib/blog";
import { highlightLexical } from "@/lib/highlightLexical";
import { Header } from "@/components/sections/Header";
import { BlogDetailHero } from "@/components/sections/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/sections/blog/BlogDetailContent";
import { BlogDetailAuthor } from "@/components/sections/blog/BlogDetailAuthor";
import { BlogDetailFAQ } from "@/components/sections/blog/BlogDetailFAQ";
import { BlogDetailRelatedPosts } from "@/components/sections/blog/BlogDetailRelatedPosts";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { Footer } from "@/components/sections/Footer";
import { buildPageMetadata } from "@/lib/seo/canonical";
import {
  JsonLd,
  blogPostingSchema,
  breadcrumbSchema,
} from "@/lib/seo/jsonld";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug).catch(() => null);
  if (!post) {
    return buildPageMetadata({
      title: "Blog post",
      description: "CleanStart blog post.",
      path: `/blog/${slug}`,
      noindex: true,
    });
  }

  const heroAbsolute = mediaUrl(post.heroImage?.url);

  return buildPageMetadata({
    title: post.title,
    description:
      post.abstract ??
      "Insights and writings from the CleanStart team on container security, DevOps, and compliance.",
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    authors: post.authors?.map((a) => a.name),
    ...(heroAbsolute && post.heroImage
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
  const [relatedPosts, highlightedBody] = await Promise.all([
    getRelatedBlogs(post.id, categoryIds, { draft }),
    highlightLexical(post.body),
  ]);

  const heroAbsolute = mediaUrl(post.heroImage?.url);

  return (
    <>
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
          path: `/blog/${post.slug}`,
          publishedAt: post.publishedAt,
          modifiedAt: post.updatedAt,
          imageUrl: heroAbsolute,
          authors: post.authors?.map((a) => ({ name: a.name })),
          category: post.categories?.name,
        })}
      />
      <Header />
      <main>
        <BlogDetailHero
          title={post.title}
          categories={post.categories}
          authors={post.authors}
          publishedAt={post.publishedAt ?? undefined}
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

        {post.faqs && post.faqs.length > 0 && (
          <BlogDetailFAQ faqs={post.faqs} />
        )}

        {/* Trailing buffer ensures 80px visible gap between the last section's
            content and the CTA card top (CTA card overhangs by 170px, so the
            section preceding the footer needs +250px below its last content
            block). Each branch budgets exactly that, accounting for the
            internal pb already provided by the last rendered section. */}
        {relatedPosts.length > 0 ? (
          <div style={{ background: "linear-gradient(180deg, #151021 0%, #131E8F 62%, #471EC0 100%)", paddingBottom: "230px" }}>
            <BlogDetailRelatedPosts posts={relatedPosts} />
          </div>
        ) : post.faqs && post.faqs.length > 0 ? (
          /* FAQ section already has pb-20 (80px) → spacer covers remaining 170 */
          <div aria-hidden className="bg-white" style={{ height: "170px" }} />
        ) : (
          /* Author section has internal pb-16 (64px) → spacer covers remaining 186 */
          <div aria-hidden className="bg-white" style={{ height: "186px" }} />
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
