import Link from "next/link";
import type { Guide } from "@/lib/guides";
import { EmptyState } from "@/components/feedback";
import { Pagination } from "@/components/ui/Pagination";
import { RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { GuideCard } from "./GuideCard";

interface GuidesListProps {
  guides: Guide[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}

function buildPageHref(page: number, searchQuery: string): string {
  const params = new URLSearchParams();
  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/guide?${qs}` : "/guide";
}

export function GuidesList({
  guides,
  currentPage,
  totalPages,
  searchQuery,
}: GuidesListProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f6f6f6", paddingBottom: "var(--spacing-section-cta)" }}
      data-section="GuidesList"
    >
      {/* Radial gradient blobs — left + right, anchored near the section bottom. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-616px",
          top: "1407px",
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
          top: "1512px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />
      {/* Gridlines — radial-faded SVG pinned to the section bottom. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{ height: "719px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/shared/listing-gridlines.svg"
          alt=""
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none"
          style={{ width: "1920px", height: "719px", maxWidth: "none" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Blur ellipses anchored to the section bottom, just above the CTA/footer. */}
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
        {/* Section heading for the document outline — the hero <h1> is followed
            by card <h3>s, so this fills the h2 level. Visually hidden. */}
        <h2 className="sr-only">All guides</h2>
        <div style={{ height: "var(--spacing-section-sm)" }} />

        {guides.length === 0 ? (
          searchQuery ? (
            <EmptyState
              variant="no-results"
              actions={
                <Link
                  href="/guide"
                  className="font-medium text-[#4a3bf1] underline underline-offset-4"
                  style={{ fontSize: "var(--fs-body)" }}
                >
                  Clear search
                </Link>
              }
            />
          ) : (
            <EmptyState
              variant="empty"
              title="No guides yet"
              description="Check back soon. New guides are on the way."
            />
          )
        ) : (
          <>
            <RevealStagger
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              style={{ gap: "32px", justifyItems: "center" }}
            >
              {guides.map((guide, index) => (
                <RevealItem key={guide.id} className="h-full w-full flex justify-center">
                  {/* Preload the first 8 cards (2 rows at 4-col xl, 2+ at 3-col lg).
                      They are LCP candidates and must not wait for lazy discovery. */}
                  <GuideCard guide={guide} priority={index < 8} />
                </RevealItem>
              ))}
            </RevealStagger>

            {/* DESKTOP — full numbered pagination. */}
            <div className="hidden lg:block">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(p) => buildPageHref(p, searchQuery)}
              />
            </div>

            {/* MOBILE — compact "< num >" pagination. */}
            {totalPages > 1 && (
              <CompactMobilePagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(p) => buildPageHref(p, searchQuery)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

interface CompactMobilePaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

function CompactMobilePagination({
  currentPage,
  totalPages,
  buildHref,
}: CompactMobilePaginationProps): React.ReactElement {
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;
  return (
    <nav
      aria-label="Pagination"
      className="lg:hidden flex items-center justify-center"
      style={{ gap: "16px", marginTop: "40px" }}
    >
      {prevDisabled ? (
        <span
          aria-hidden
          className="inline-flex items-center justify-center select-none"
          style={{ width: "24px", height: "24px", opacity: 0.32 }}
        >
          <ChevronArrow direction="left" />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage - 1)}
          aria-label="Previous page"
          rel="prev"
          className="inline-flex items-center justify-center"
          style={{ width: "24px", height: "24px" }}
        >
          <ChevronArrow direction="left" />
        </Link>
      )}
      <span
        aria-current="page"
        className="font-sans"
        style={{
          fontSize: "var(--fs-body)",
          fontWeight: 600,
          color: "#4a3bf1",
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {currentPage}
      </span>
      {nextDisabled ? (
        <span
          aria-hidden
          className="inline-flex items-center justify-center select-none"
          style={{ width: "24px", height: "24px", opacity: 0.32 }}
        >
          <ChevronArrow direction="right" />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage + 1)}
          aria-label="Next page"
          rel="next"
          className="inline-flex items-center justify-center"
          style={{ width: "24px", height: "24px" }}
        >
          <ChevronArrow direction="right" />
        </Link>
      )}
    </nav>
  );
}

function ChevronArrow({
  direction,
}: {
  direction: "left" | "right";
}): React.ReactElement {
  const path = direction === "right" ? "M9 6l6 6-6 6" : "M15 18l-6-6 6-6";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={path}
        stroke="#4a3bf1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
