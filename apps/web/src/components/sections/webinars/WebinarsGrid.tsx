import Link from "next/link";
import type { Webinar, WebinarRegion, WebinarType } from "@/lib/webinars";
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
      {/* Soft grid backdrop (faint) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
          backgroundSize: "71px 71px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 80%)",
        }}
      />

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

                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      activeType={activeType}
                      activeRegion={activeRegion}
                    />
                  )}
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

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  activeType?: WebinarType | undefined;
  activeRegion?: WebinarRegion | undefined;
}

function Pagination({
  currentPage,
  totalPages,
  activeType,
  activeRegion,
}: PaginationProps): React.ReactElement {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav
      aria-label="Webinar pagination"
      className="flex items-center justify-center mt-[64px]"
      style={{ gap: "12px" }}
    >
      {pages.map((p) => {
        const active = p === currentPage;
        const href = buildPageHref(p, activeType, activeRegion);
        return (
          <Link
            key={p}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={`Go to page ${p}`}
            className="flex items-center justify-center transition-colors"
            style={{
              width: active ? "32px" : "12px",
              height: "12px",
              borderRadius: "999px",
              background: active ? "#4A3BF1" : "rgba(17,17,17,0.18)",
              color: active ? "#fff" : "transparent",
              fontSize: "0",
            }}
          >
            {p}
          </Link>
        );
      })}
    </nav>
  );
}
