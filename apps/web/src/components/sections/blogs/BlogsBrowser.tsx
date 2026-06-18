"use client";

import { useSearchParams } from "next/navigation";
import { BlogsContent, selectBlogs } from "@/components/sections/blogs/BlogsContent";
import type { Blog, BlogCategory } from "@/lib/blog";

interface BlogsBrowserProps {
  allPosts: Blog[];
  featuredPost: Blog | null;
  categories: BlogCategory[];
}

/**
 * Client driver for the /blogs listing. Reads the category / search / page
 * filters from the URL (`useSearchParams`) and filters the full card set in
 * memory, so the route stays statically rendered — the existing `<Link>`-based
 * category pills and pagination become instant client-side URL updates against
 * the static page instead of per-request server renders.
 *
 * Must be wrapped in a `<Suspense>` boundary by the page so `useSearchParams`
 * doesn't opt the whole route into client rendering; the boundary's fallback is
 * the server-rendered default view, which is what ends up in the static HTML.
 */
export function BlogsBrowser({
  allPosts,
  featuredPost,
  categories,
}: BlogsBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const activeCategory = params.get("category") ?? "";
  const searchQuery = params.get("q") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const { posts, totalPages } = selectBlogs(allPosts, {
    category: activeCategory,
    search: searchQuery,
    page,
  });

  return (
    <BlogsContent
      featuredPost={featuredPost}
      categories={categories}
      posts={posts}
      activeCategory={activeCategory}
      searchQuery={searchQuery}
      currentPage={Math.min(page, totalPages)}
      totalPages={totalPages}
    />
  );
}
