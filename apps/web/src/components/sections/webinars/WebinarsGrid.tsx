import type { Webinar, WebinarRegion, WebinarType } from "@/lib/webinars";
import { Pagination } from "@/components/ui/Pagination";
import { WebinarCard } from "./WebinarCard";
import { WebinarFilters } from "./WebinarFilters";

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
      className="relative overflow-hidden"
      style={{ background: "#F6F6F6", paddingTop: "72px", paddingBottom: "250px" }}
      data-section="WebinarsGrid"
    >
      {/* Figma bg gridlines — two radial-gradient grids (purple #640DFB @10%)
          fading from top-left and top-right corners. The fade is baked into
          the SVG via two radialGradient fills (centers (59.5,82.5) and
          (1746.5,158.5), r=590.5). Render at intrinsic 1922×749, anchored
          top-center so the corner blobs sit where Figma placed them. */}
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
        <div
          className="grid"
          style={{
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: "32px",
          }}
        >
          <div className="lg:grid lg:gap-8" style={lgGrid}>
            <div className="lg:sticky" style={{ alignSelf: "start", top: "96px" }}>
              <WebinarFilters
                activeType={activeType}
                activeRegion={activeRegion}
              />
            </div>

            <div>
              {items.length === 0 ? (
                <p
                  className="font-sans text-center py-20"
                  style={{ color: "rgba(17,17,17,0.54)", fontSize: "1.125rem" }}
                >
                  No webinars match these filters yet.
                </p>
              ) : (
                <>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center lg:justify-items-stretch"
                    style={{ gap: "24px" }}
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
      </div>
    </section>
  );
}

const lgGrid: React.CSSProperties = {
  gridTemplateColumns: "299px minmax(0, 1fr)",
};
