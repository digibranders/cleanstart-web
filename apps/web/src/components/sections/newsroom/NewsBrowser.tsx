"use client";

import { useSearchParams } from "next/navigation";
import { NewsContent, selectNews } from "@/components/sections/newsroom/NewsContent";
import type { News, NewsCategory } from "@/lib/news";
import { parseRegionParam, parseYearParam } from "@/lib/news-utils";

interface NewsBrowserProps {
  allNews: News[];
  categories: NewsCategory[];
}

/**
 * Client driver for the /news listing. Reads the category / region / year /
 * search / page filters from the URL (`useSearchParams`) and filters the full
 * set in memory, so the route stays statically rendered. Must be wrapped in a
 * `<Suspense>` boundary by the page. See `BlogsBrowser.tsx`.
 */
export function NewsBrowser({
  allNews,
  categories,
}: NewsBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const activeCategory = params.get("category") ?? "";
  const activeRegion = parseRegionParam(params.get("region") ?? undefined);
  const activeYear = parseYearParam(params.get("year") ?? undefined);
  const searchQuery = params.get("q") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const { items, totalPages } = selectNews(allNews, {
    category: activeCategory,
    region: activeRegion,
    year: activeYear,
    search: searchQuery,
    page,
  });

  return (
    <NewsContent
      categories={categories}
      items={items}
      activeCategory={activeCategory}
      activeRegion={activeRegion}
      activeYear={activeYear}
      searchQuery={searchQuery}
      currentPage={Math.min(page, totalPages)}
      totalPages={totalPages}
    />
  );
}
