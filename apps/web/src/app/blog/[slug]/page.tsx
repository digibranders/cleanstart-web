import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogBySlug, getRelatedBlogs } from "@/lib/blog";
import { BlogDetailHero } from "@/components/sections/blog/BlogDetailHero";
import { BlogDetailContent } from "@/components/sections/blog/BlogDetailContent";
import { BlogDetailRelatedPosts } from "@/components/sections/blog/BlogDetailRelatedPosts";
import { ReadyToSecureCTA } from "@/components/sections/ReadyToSecureCTA";
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

  const categoryIds = (post.categories ?? []).map((c) => c.id);
  const relatedPosts = await getRelatedBlogs(post.id, categoryIds);

  return (
    <>
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

        {relatedPosts.length > 0 && (
          <BlogDetailRelatedPosts posts={relatedPosts} />
        )}

        <ReadyToSecureCTA />
      </main>

      <Footer />
    </>
  );
}
