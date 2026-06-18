"use client";

import { useSearchParams } from "next/navigation";
import { GuidesContent, selectGuides } from "@/components/sections/guides/GuidesContent";
import type { Guide } from "@/lib/guides";

interface GuidesBrowserProps {
  allGuides: Guide[];
}

/**
 * Client driver for the /guide listing — reads the search/page filters from the
 * URL and filters the full set in memory so the route stays static. Must be
 * wrapped in `<Suspense>` by the page. See `BlogsBrowser.tsx`.
 */
export function GuidesBrowser({ allGuides }: GuidesBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const searchQuery = params.get("q") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const { guides, totalPages } = selectGuides(allGuides, { search: searchQuery, page });

  return (
    <GuidesContent
      guides={guides}
      searchQuery={searchQuery}
      currentPage={Math.min(page, totalPages)}
      totalPages={totalPages}
    />
  );
}
