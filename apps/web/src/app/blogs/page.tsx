import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { BlogsHero } from "@/components/sections/blogs/BlogsHero";
import { LatestBlogs } from "@/components/sections/blogs/LatestBlogs";
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
      <main style={{ background: "#f6f6f6" }}>
        {/* Hero — dark gradient, includes featured post */}
        <div className="relative overflow-hidden">
          <BlogsHero
            featuredPost={featuredPost}
            categories={categories}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
          />
        </div>

        {/* Latest articles grid */}
        <FadeUp>
          <LatestBlogs
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
      <Footer topPadding={225} />
    </>
  );
}
