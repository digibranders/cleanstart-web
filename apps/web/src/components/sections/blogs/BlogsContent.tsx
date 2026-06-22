import { LatestBlogs } from "@/components/sections/blogs/LatestBlogs";
import { FadeUp } from "@/components/ui/FadeUp";
import type { Blog } from "@/lib/blog";

export interface BlogsContentProps {
  posts: Blog[];
  activeCategory: string;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
}

/**
 * Paginated blog grid — the body the `<Suspense>` boundary swaps (server
 * fallback + client `BlogsBrowser`). The hero (featured + category pills +
 * search) is rendered once by the page OUTSIDE the boundary, so its <h1> isn't
 * streamed twice. See `case-studies/page.tsx` for the pattern.
 */
export function BlogsContent({
  posts,
  activeCategory,
  searchQuery,
  currentPage,
  totalPages,
}: BlogsContentProps): React.ReactElement {
  return (
    <FadeUp>
      <LatestBlogs
        posts={posts}
        currentPage={currentPage}
        totalPages={totalPages}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
      />
    </FadeUp>
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
