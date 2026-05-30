import Link from "next/link";
import type { News } from "@/lib/news";
import { EmptyState } from "@/components/feedback";
import { Pagination } from "@/components/ui/Pagination";
import { RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { NewsroomCard } from "./NewsroomCard";

interface NewsroomGridProps {
  items: News[];
  currentPage: number;
  totalPages: number;
  activeCategory: string;
  searchQuery: string;
  /** True when the CMS fetch failed (vs. a genuinely empty result). */
  loadFailed?: boolean;
}

function buildPageHref(
  page: number,
  activeCategory: string,
  searchQuery: string,
): string {
  const params = new URLSearchParams();
  if (activeCategory) params.set("category", activeCategory);
  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/news?${qs}` : "/news";
}

export function NewsroomGrid({
  items,
  currentPage,
  totalPages,
  activeCategory,
  searchQuery,
  loadFailed = false,
}: NewsroomGridProps): React.ReactElement {
  const hasFilters = Boolean(activeCategory || searchQuery);
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f6f6f6", paddingTop: "clamp(48px, 6vw, 80px)", paddingBottom: "var(--spacing-section-cta)" }}
      data-section="NewsroomGrid"
    >
      {/* Bottom blob pair anchors to section bottom so it tracks the listing height regardless of page count. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-641px",
          top: "-591px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "1283px",
          top: "-560px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-532px",
          bottom: "-411px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "1238px",
          bottom: "-262px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{ height: "719px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/latest-blogs-gridlines.svg"
          alt=""
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none"
          style={{ width: "1920px", height: "719px", maxWidth: "none" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Blur ellipses anchored to section bottom so they sit just above the CTA/footer. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-70px",
          bottom: "0px",
          width: "258px",
          height: "258px",
          borderRadius: "50%",
          background: "#df9bff",
          filter: "blur(121.5px)",
          opacity: 0.8,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          right: "-66px",
          bottom: "0px",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background: "#2cc1eb",
          filter: "blur(101.5px)",
          opacity: 0.2,
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {items.length === 0 ? (
          loadFailed ? (
            <EmptyState variant="load-failed" />
          ) : hasFilters ? (
            <EmptyState
              variant="no-results"
              actions={
                <Link
                  href="/news"
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
              title="No news yet"
              description="Check back soon — new stories are on the way."
            />
          )
        ) : (
          <>
            <RevealStagger
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              style={{ gap: "32px", justifyItems: "center" }}
            >
              {items.map((item) => (
                <RevealItem key={item.id}>
                  <NewsroomCard item={item} />
                </RevealItem>
              ))}
            </RevealStagger>

            {totalPages > 1 && currentPage < totalPages && (
              <div
                className="flex lg:hidden justify-center"
                style={{ marginTop: "40px" }}
              >
                <Link
                  href={buildPageHref(currentPage + 1, activeCategory, searchQuery)}
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
                buildHref={(p) => buildPageHref(p, activeCategory, searchQuery)}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
