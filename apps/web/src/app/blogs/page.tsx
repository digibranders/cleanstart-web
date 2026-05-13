import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsHero } from "@/components/sections/blogs/BlogsHero";
import { LatestArticles } from "@/components/sections/blogs/LatestArticles";
import { BlogsCTA } from "@/components/sections/blogs/BlogsCTA";
import { FadeUp } from "@/components/ui/FadeUp";
import {
  getFeaturedBlog,
  getBlogs,
  getBlogCategories,
} from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blogs | CleanStart",
  description:
    "A curated collection of writings, research, and solutions on container security, DevOps, and compliance.",
};

interface BlogsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    q?: string;
  }>;
}

export default async function BlogsPage({
  searchParams,
}: BlogsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const activeCategory = params.category ?? "";
  const searchQuery = params.q ?? "";

  const [featuredPost, blogsData, categories] = await Promise.all([
    getFeaturedBlog().catch(() => null),
    getBlogs({
      page,
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    }).catch(
      () => ({ docs: [], hasNextPage: false, page: 1, totalDocs: 0, totalPages: 1 }),
    ),
    getBlogCategories().catch(() => []),
  ]);

  return (
    <>
      <Header />
      <main>
        {/* Hero — dark gradient, includes featured post */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.2%, rgb(19,30,143) 51.0%, rgb(71,30,192) 68.7%, rgb(71,31,195) 79.8%, rgba(70,30,191,0.85) 85.0%, rgba(66,30,188,0.4) 93.7%, rgba(66,30,188,0) 98.9%)",
          }}
        >
          <BlogsHero
            featuredPost={featuredPost}
            categories={categories}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
          />
          {/* Gradient fade into white content section */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(246,246,246,0) 0%, rgba(246,246,246,0.4) 40%, rgba(246,246,246,0.85) 70%, #f6f6f6 100%)",
            }}
          />
        </div>

        {/* Latest articles grid */}
        <FadeUp>
          <LatestArticles
            posts={blogsData.docs}
            hasMore={blogsData.hasNextPage}
            currentPage={page}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
          />
        </FadeUp>

        {/* Newsletter CTA — overlaps footer by 126px (matches Figma y=-126 in footer frame) */}
        <FadeUp className="relative z-10 mt-[-126px]">
          <BlogsCTA />
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
