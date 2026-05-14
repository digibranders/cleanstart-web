import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogBySlug, getRelatedBlogs } from "@/lib/blog";
import { Header } from "@/components/sections/Header";
import { BlogDetailHero } from "@/components/sections/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/sections/blog/BlogDetailContent";
import { BlogDetailFAQ } from "@/components/sections/blog/BlogDetailFAQ";
import { BlogDetailRelatedPosts } from "@/components/sections/blog/BlogDetailRelatedPosts";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { Footer } from "@/components/sections/Footer";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return {};

  const ogImage = post.heroImage?.url;

  return {
    title: post.title,
    description: post.abstract ?? undefined,
    openGraph: {
      title: post.title,
      description: post.abstract ?? undefined,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      authors: post.authors?.map((a) => a.name),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.abstract ?? undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);

  if (!post) notFound();

  const categoryIds = post.categories ? [post.categories.id] : [];
  const relatedPosts = await getRelatedBlogs(post.id, categoryIds);

  return (
    <>
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
