import { BlogsHero } from "@/components/sections/blogs/BlogsHero";
import { LatestBlogs } from "@/components/sections/blogs/LatestBlogs";
import { FadeUp } from "@/components/ui/FadeUp";
import type { Blog, BlogCategory } from "@/lib/blog";

export interface BlogsContentProps {
  featuredPost: Blog | null;
  categories: BlogCategory[];
  posts: Blog[];
  activeCategory: string;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
}

/**
 * Presentational body of the /blogs listing — the hero (featured + category
 * filter + search) plus the paginated grid. Pure props, no data fetching, so it
 * renders identically on the server (static fallback) and the client
 * (`BlogsBrowser`, which drives it from the URL filters). Keeping it shared
 * means the static HTML and the hydrated view are byte-identical for the default
 * (unfiltered, page 1) state — no hydration flash.
 */
export function BlogsContent({
  featuredPost,
  categories,
  posts,
  activeCategory,
  searchQuery,
  currentPage,
  totalPages,
}: BlogsContentProps): React.ReactElement {
  return (
    <main id="main-content" style={{ background: "#f6f6f6" }}>
      <div className="relative overflow-hidden">
        <BlogsHero
          featuredPost={featuredPost}
          categories={categories}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
        />
      </div>

      <FadeUp>
        <LatestBlogs
          posts={posts}
          currentPage={currentPage}
          totalPages={totalPages}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
        />
      </FadeUp>
    </main>
  );
}

/** Page size for the listing grid (matches the prior server-side pagination). */
export const BLOGS_PAGE_SIZE = 9;

/**
 * Client-safe filter+paginate over the full card set — the same selection the
 * server `getBlogs` used to do (category by slug, search by case-insensitive
 * title contains), now in memory so the page can stay static.
 */
export function selectBlogs(
  all: Blog[],
  { category, search, page }: { category: string; search: string; page: number },
): { posts: Blog[]; totalPages: number } {
  const q = search.trim().toLowerCase();
  const filtered = all.filter((p) => {
    const catOk = !category || p.categories?.slug === category;
    const searchOk = !q || p.title.toLowerCase().includes(q);
    return catOk && searchOk;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / BLOGS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * BLOGS_PAGE_SIZE;
  return { posts: filtered.slice(start, start + BLOGS_PAGE_SIZE), totalPages };
}
