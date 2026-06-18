import { WebinarsHero } from "@/components/sections/webinars/WebinarsHero";
import { WebinarsGrid } from "@/components/sections/webinars/WebinarsGrid";
import { FadeUp } from "@/components/ui/FadeUp";
import type { Webinar, WebinarRegion, WebinarType } from "@/lib/webinars";

export interface WebinarsContentProps {
  items: Webinar[];
  currentPage: number;
  totalPages: number;
  activeType?: WebinarType | undefined;
  activeRegion?: WebinarRegion | undefined;
  /** True when the CMS fetch failed (vs. a genuinely empty result). */
  loadFailed?: boolean;
}

/**
 * Presentational body of the /webinars listing (hero + filter sidebar +
 * paginated grid). Pure props — renders identically on the server (static
 * fallback) and the client (`WebinarsBrowser`). See `BlogsContent.tsx` for the
 * pattern.
 */
export function WebinarsContent({
  items,
  currentPage,
  totalPages,
  activeType,
  activeRegion,
  loadFailed = false,
}: WebinarsContentProps): React.ReactElement {
  return (
    <main id="main-content" style={{ background: "#F6F6F6" }}>
      <div className="relative overflow-hidden">
        <WebinarsHero />
      </div>

      <FadeUp>
        <WebinarsGrid
          items={items}
          currentPage={currentPage}
          totalPages={totalPages}
          activeType={activeType}
          activeRegion={activeRegion}
          loadFailed={loadFailed}
        />
      </FadeUp>
    </main>
  );
}

/** Page size for the listing grid (matches the prior server getWebinars default limit). */
export const WEBINARS_PAGE_SIZE = 9;

/**
 * Client-safe filter + paginate over the full webinar set — mirrors the prior
 * server `getWebinars` where-clauses: `webinarType[equals]` and
 * `region[equals]`. The base published / not-cancelled filtering and the
 * `-startsAt` sort are applied server-side at fetch time, so this only narrows
 * by the two user-facing facets and paginates.
 */
export function selectWebinars(
  all: Webinar[],
  {
    type,
    region,
    page,
  }: {
    type: WebinarType | undefined;
    region: WebinarRegion | undefined;
    page: number;
  },
): { items: Webinar[]; totalPages: number } {
  const filtered = all.filter((w) => {
    const typeOk = !type || w.webinarType === type;
    const regionOk = !region || w.region === region;
    return typeOk && regionOk;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / WEBINARS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * WEBINARS_PAGE_SIZE;
  return { items: filtered.slice(start, start + WEBINARS_PAGE_SIZE), totalPages };
}
