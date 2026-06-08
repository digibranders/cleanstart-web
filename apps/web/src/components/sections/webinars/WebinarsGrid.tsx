import dynamic from "next/dynamic";
import Link from "next/link";
import type { Webinar, WebinarRegion, WebinarType } from "@/lib/webinars";
import { EmptyState } from "@/components/feedback";
import { Pagination } from "@/components/ui/Pagination";
import { RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { WebinarCard } from "./WebinarCard";
// Code-split the interactive client sidebar out of the initial /webinars bundle.
const WebinarFilters = dynamic(() =>
  import("./WebinarFilters").then((m) => ({ default: m.WebinarFilters })),
);

interface WebinarsGridProps {
  items: Webinar[];
  currentPage: number;
  totalPages: number;
  activeType?: WebinarType | undefined;
  activeRegion?: WebinarRegion | undefined;
  /** True when the CMS fetch failed (vs. a genuinely empty result). */
  loadFailed?: boolean;
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
  loadFailed = false,
}: WebinarsGridProps): React.ReactElement {
  const hasFilters = Boolean(activeType || activeRegion);
  return (
    <section
      className="relative"
      style={{
        background: "#F6F6F6",
        paddingTop: "var(--spacing-section-md)",
        paddingBottom: "var(--spacing-section-cta)",
        overflowX: "clip",
      }}
      data-section="WebinarsGrid"
    >
      {/* Section uses overflow-x: clip (not overflow: hidden) so the sticky
          filter sidebar tracks the window scroll instead of being trapped
          inside a scroll container. */}
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Section heading for the document outline — the hero <h1> is followed
            by card <h3>s, so this fills the h2 level. Visually hidden. */}
        <h2 className="sr-only">All webinars</h2>
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
              loadFailed ? (
                <EmptyState variant="load-failed" />
              ) : hasFilters ? (
                <EmptyState
                  variant="no-results"
                  title="No webinars match these filters"
                  actions={
                    <Link
                      href="/webinars"
                      className="font-sans font-medium text-[#4a3bf1] underline underline-offset-4"
                      style={{ fontSize: "var(--fs-body)" }}
                    >
                      Clear filters
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  variant="empty"
                  title="No webinars yet"
                  description="Check back soon. New sessions are on the way."
                />
              )
            ) : (
              <>
                <RevealStagger
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center lg:justify-items-stretch"
                  style={{ gap: "32px" }}
                >
                  {items.map((item) => (
                    <RevealItem key={item.id}>
                      <WebinarCard item={item} />
                    </RevealItem>
                  ))}
                </RevealStagger>

                {totalPages > 1 && currentPage < totalPages && (
                  <div className="flex lg:hidden justify-center" style={{ marginTop: "40px" }}>
                    <Link
                      href={buildPageHref(currentPage + 1, activeType, activeRegion)}
                      rel="next"
                      className="font-sans inline-flex items-center gap-2"
                      style={{
                        height: "44px",
                        padding: "0 20px",
                        borderRadius: "10px",
                        background: "white",
                        color: "#4a3bf1",
                        fontSize: "var(--fs-body-sm)",
                        fontWeight: 500,
                        border: "1px solid rgba(74,59,241,0.25)",
                      }}
                    >
                      View More
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path
                          d="M3.5 8h9M8.5 4l4 4-4 4"
                          stroke="#4a3bf1"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>
                )}

                <div className="hidden lg:block">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    buildHref={(p) => buildPageHref(p, activeType, activeRegion)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
