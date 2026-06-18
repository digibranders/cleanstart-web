import { GuidesHero } from "@/components/sections/guides/GuidesHero";
import { GuidesList } from "@/components/sections/guides/GuidesList";
import { FadeUp } from "@/components/ui/FadeUp";
import type { Guide } from "@/lib/guides";

export interface GuidesContentProps {
  guides: Guide[];
  searchQuery: string;
  currentPage: number;
  totalPages: number;
}

/**
 * Presentational body of the /guide listing (hero + search + paginated grid).
 * Pure props — renders identically on the server (static fallback) and the
 * client (`GuidesBrowser`). See `BlogsContent.tsx` for the pattern.
 */
export function GuidesContent({
  guides,
  searchQuery,
  currentPage,
  totalPages,
}: GuidesContentProps): React.ReactElement {
  return (
    <main id="main-content" style={{ background: "#f6f6f6" }}>
      <div className="relative overflow-hidden">
        <GuidesHero searchQuery={searchQuery} />
      </div>
      <FadeUp>
        <GuidesList
          guides={guides}
          currentPage={currentPage}
          totalPages={totalPages}
          searchQuery={searchQuery}
        />
      </FadeUp>
    </main>
  );
}

export const GUIDES_PAGE_SIZE = 16;

/** Client-safe search + paginate (matches the prior server getGuides: title contains). */
export function selectGuides(
  all: Guide[],
  { search, page }: { search: string; page: number },
): { guides: Guide[]; totalPages: number } {
  const q = search.trim().toLowerCase();
  const filtered = q ? all.filter((g) => g.title.toLowerCase().includes(q)) : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / GUIDES_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * GUIDES_PAGE_SIZE;
  return { guides: filtered.slice(start, start + GUIDES_PAGE_SIZE), totalPages };
}
