import type { News, NewsCategory, NewsRegion } from "@/lib/news";
import { NewsroomGrid } from "@/components/sections/newsroom/NewsroomGrid";
import { FadeUp } from "@/components/ui/FadeUp";

export interface NewsContentProps {
  categories: NewsCategory[];
  items: News[];
  activeCategory: string;
  activeRegion?: NewsRegion | undefined;
  activeYear?: number | undefined;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
}

/**
 * Filtered, paginated news grid with its sticky filter sidebar — the body the
 * `<Suspense>` boundary swaps (server fallback + client `NewsBrowser`). The hero
 * (featured + search) is rendered once by the page OUTSIDE the boundary, so its
 * <h1> isn't streamed twice. See `case-studies/page.tsx` for the pattern.
 */
export function NewsContent({
  categories,
  items,
  activeCategory,
  activeRegion,
  activeYear,
  searchQuery,
  currentPage,
  totalPages,
}: NewsContentProps): React.ReactElement {
  return (
    <FadeUp>
      <NewsroomGrid
        items={items}
        currentPage={currentPage}
        totalPages={totalPages}
        categories={categories}
        activeCategory={activeCategory}
        activeRegion={activeRegion}
        activeYear={activeYear}
        searchQuery={searchQuery}
      />
    </FadeUp>
  );
}

/** Page size for the listing grid (matches the prior server `getNews` default limit). */
export const NEWS_PAGE_SIZE = 9;

/**
 * Client-safe filter+paginate over the full news set — the same selection the
 * server `getNews` did via its where-clauses, now in memory so the page can stay
 * static:
 *   - category: `newsCategories.slug` contains the slug (`[in]`)
 *   - region:   `region` equals
 *   - year:     `publicationDate` within [year-01-01, year+1-01-01)
 *   - search:   `title` contains (case-insensitive)
 */
export function selectNews(
  all: News[],
  {
    category,
    region,
    year,
    search,
    page,
  }: {
    category: string;
    region?: NewsRegion | undefined;
    year?: number | undefined;
    search: string;
    page: number;
  },
): { items: News[]; totalPages: number } {
  const q = search.trim().toLowerCase();
  const filtered = all.filter((n) => {
    const catOk =
      !category || (n.newsCategories ?? []).some((c) => c.slug === category);
    const regionOk = !region || n.region === region;
    let yearOk = true;
    if (year) {
      if (!n.publicationDate) {
        yearOk = false;
      } else {
        const t = new Date(n.publicationDate).getTime();
        const lower = Date.UTC(year, 0, 1);
        const upper = Date.UTC(year + 1, 0, 1);
        yearOk = t >= lower && t < upper;
      }
    }
    const searchOk = !q || n.title.toLowerCase().includes(q);
    return catOk && regionOk && yearOk && searchOk;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / NEWS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * NEWS_PAGE_SIZE;
  return { items: filtered.slice(start, start + NEWS_PAGE_SIZE), totalPages };
}
