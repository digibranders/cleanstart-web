import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogBySlug, getRelatedBlogs, mediaUrl } from "@/lib/blog";
import { Header } from "@/components/sections/Header";
import { BlogDetailHero } from "@/components/sections/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/sections/blog/BlogDetailContent";
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

export default async function BlogDetailPage({ params }: BlogDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) notFound();

  const categoryIds = post.categories ? [post.categories.id] : [];
  const relatedPosts = await getRelatedBlogs(post.id, categoryIds);

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
          readingMinutes={post.readingMinutes ?? undefined}
          heroImage={post.heroImage}
        />

        <BlogDetailContent
          body={post.body}
          tableOfContents={post.tableOfContents}
          heroImage={post.heroImage}
          abstract={post.abstract ?? undefined}
        />

        {post.faqs && post.faqs.length > 0 && (
          <BlogDetailFAQ faqs={post.faqs} />
        )}

        {/* Dark zone — Related posts only */}
        {relatedPosts.length > 0 && (
          <div style={{ background: "linear-gradient(180deg, #151021 0%, #131E8F 62%, #471EC0 100%)" }}>
            <BlogDetailRelatedPosts posts={relatedPosts} />
          </div>
        )}

        <BlogDetailCTA />
      </main>

      <Footer />
    </>
  );
}
