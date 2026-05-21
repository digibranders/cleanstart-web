import dynamic from "next/dynamic";
import type { Webinar, WebinarRegion, WebinarType } from "@/lib/webinars";
import { Pagination } from "@/components/ui/Pagination";
import { WebinarCard } from "./WebinarCard";
// WebinarFilters is a "use client" interactive sidebar; code-split so it
// does not ship in the initial /webinars client bundle.
const WebinarFilters = dynamic(() =>
  import("./WebinarFilters").then((m) => ({ default: m.WebinarFilters })),
);

interface WebinarsGridProps {
  items: Webinar[];
  currentPage: number;
  totalPages: number;
  activeType?: WebinarType | undefined;
  activeRegion?: WebinarRegion | undefined;
}

function buildPageHref(
  page: number,
  type: WebinarType | undefined,
  region: WebinarRegion | undefined,
): string {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (region) params.set("region", region);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/webinars?${qs}` : "/webinars";
}

export function WebinarsGrid({
  items,
  currentPage,
  totalPages,
  activeType,
  activeRegion,
}: WebinarsGridProps): React.ReactElement {
  return (
    <section
      className="relative"
      style={{
        background: "#F6F6F6",
        paddingTop: "var(--spacing-section-md)",
        paddingBottom: "250px",
        overflowX: "clip",
      }}
      data-section="WebinarsGrid"
    >
      {/* Figma bg gridlines — two radial-gradient grids (purple #640DFB @10%)
          fading from top-left and top-right corners. The fade is baked into
          the SVG via two radialGradient fills (centers (59.5,82.5) and
          (1746.5,158.5), r=590.5). Render at intrinsic 1922×749, anchored
          top-center so the corner blobs sit where Figma placed them.
          NOTE: section uses overflow-x: clip (not overflow: hidden) so
          `position: sticky` on the filter sidebar still tracks the window
          scroll instead of being trapped inside a scroll container. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute top-0 left-1/2 -translate-x-1/2"
        style={{ width: "1922px", height: "749px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/webinars/bg-gridlines.svg"
          alt=""
          aria-hidden
          className="block"
          style={{ width: "1922px", height: "749px", maxWidth: "none" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="relative mx-auto max-w-[1276px] px-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
          <aside
            className="shrink-0 lg:sticky lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto"
            style={{ top: "96px", alignSelf: "flex-start" }}
          >
            <WebinarFilters
              activeType={activeType}
              activeRegion={activeRegion}
            />
          </aside>

          <div className="flex-1 min-w-0">
            {items.length === 0 ? (
              <p
                className="font-sans text-body-lg text-center py-20"
                style={{ color: "rgba(17,17,17,0.54)" }}
              >
                No webinars match these filters yet.
              </p>
            ) : (
              <>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center lg:justify-items-stretch"
                  style={{ gap: "32px" }}
                >
                  {items.map((item) => (
                    <WebinarCard key={item.id} item={item} />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  buildHref={(p) => buildPageHref(p, activeType, activeRegion)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
