import { ResourceCenterSidebar } from "@/components/sections/resource-center/ResourceCenterSidebar";
import { ResourceGrid } from "@/components/sections/resource-center/ResourceGrid";
import { FadeUp } from "@/components/ui/FadeUp";
import type { Resource } from "@/lib/resources";

export interface ResourceCenterContentProps {
  resources: Resource[];
  activeType: string;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  loadFailed?: boolean;
}

/**
 * Sidebar type filter + paginated resources grid — the body the `<Suspense>`
 * boundary swaps (server fallback + client `ResourceCenterBrowser`). The hero
 * (search) is rendered once by the page OUTSIDE the boundary, so its <h1> isn't
 * streamed twice. See `case-studies/page.tsx` for the pattern.
 */
export function ResourceCenterContent({
  resources,
  activeType,
  searchQuery,
  currentPage,
  totalPages,
  loadFailed = false,
}: ResourceCenterContentProps): React.ReactElement {
  return (
    <FadeUp>
      <section
          className="relative"
          style={{
            background: "#f6f6f6",
            borderRadius: "32px 32px 0 0",
            marginTop: "-32px",
            zIndex: 1,
            paddingTop: "52px",
            paddingBottom: "var(--spacing-section-lg)",
          }}
          aria-label="Resources listing"
        >
          <div
            className="mx-auto"
            style={{
              maxWidth: "1276px",
              paddingLeft: "24px",
              paddingRight: "24px",
            }}
          >
            {/* Section heading for the document outline — the hero <h1> is
                followed by the sidebar "Categories" <h3> and card <h3>s, so
                this fills the h2 level. Visually hidden. */}
            <h2 className="sr-only">Resources</h2>
            <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-6 lg:gap-8">
              <ResourceCenterSidebar
                activeType={activeType}
                searchQuery={searchQuery}
              />

              <ResourceGrid
                resources={resources}
                currentPage={currentPage}
                totalPages={totalPages}
                activeType={activeType}
                searchQuery={searchQuery}
                loadFailed={loadFailed}
              />
            </div>
          </div>
        </section>
    </FadeUp>
  );
}

/** Page size for the listing grid (matches the prior server-side pagination). */
export const RESOURCES_PAGE_SIZE = 9;

/**
 * Client-safe filter+paginate over the full card set — the same selection the
 * server `getResources` used to do (type by exact equals, search by
 * case-insensitive title contains), now in memory so the page can stay static.
 */
export function selectResources(
  all: Resource[],
  { type, search, page }: { type: string; search: string; page: number },
): { resources: Resource[]; totalPages: number } {
  const q = search.trim().toLowerCase();
  const filtered = all.filter((r) => {
    const typeOk = !type || r.type === type;
    const searchOk = !q || r.title.toLowerCase().includes(q);
    return typeOk && searchOk;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / RESOURCES_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * RESOURCES_PAGE_SIZE;
  return {
    resources: filtered.slice(start, start + RESOURCES_PAGE_SIZE),
    totalPages,
  };
}
