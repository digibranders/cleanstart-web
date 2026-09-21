import type React from "react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback";
import { Pagination } from "@/components/ui/Pagination";
import { RevealItem, RevealStagger } from "@/components/ui/Reveal";
import type { CaseStudy } from "@/lib/case-studies";
import { ArrowRightIcon } from "./CaseStudyIcons";
import { CaseStudyCard } from "./CaseStudyCard";

export interface CaseStudiesContentProps {
  caseStudies: CaseStudy[];
  currentPage: number;
  totalPages: number;
  /** True when the CMS fetch failed (vs. a genuinely empty result). */
  loadFailed?: boolean;
}

function buildPageHref(page: number): string {
  return page > 1 ? `/case-studies?page=${page}` : "/case-studies";
}

/**
 * The page-dependent part of the library: cards plus pagination, and nothing
 * else. Rendered by the route's Suspense fallback (server) and by
 * `CaseStudiesBrowser` (client), so both trees end up in the streamed HTML —
 * keep every heading, anchor id and landmark in `CaseStudiesLibrary` instead,
 * or the page source carries two of each.
 */
export function CaseStudiesContent({
  caseStudies,
  currentPage,
  totalPages,
  loadFailed = false,
}: CaseStudiesContentProps): React.ReactElement {
  if (caseStudies.length === 0) {
    return loadFailed ? (
      <EmptyState variant="load-failed" />
    ) : (
      <EmptyState
        variant="empty"
        title="No case studies yet"
        description="Check back soon. New customer stories are on the way."
      />
    );
  }

  return (
    <>
      <RevealStagger
        gap={0.08}
        className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:justify-items-start lg:gap-8"
      >
        {caseStudies.map((caseStudy) => (
          <RevealItem key={caseStudy.id} className="flex w-full justify-center">
            <CaseStudyCard caseStudy={caseStudy} />
          </RevealItem>
        ))}
      </RevealStagger>

      {/* Mobile: single "View More" button. Desktop: numbered pagination. */}
      {totalPages > 1 && currentPage < totalPages && (
        <div className="flex justify-center lg:hidden" style={{ marginTop: "40px" }}>
          <Link
            href={buildPageHref(currentPage + 1)}
            rel="next"
            className="inline-flex items-center gap-2 font-sans"
            style={{
              height: "44px",
              padding: "0 20px",
              borderRadius: "10px",
              background: "white",
              color: "#4a3bf1",
              fontSize: "var(--fs-body-sm)",
              fontWeight: 500,
              border: "1px solid rgba(74,59,241,0.25)",
              boxShadow: "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01)",
            }}
          >
            View More
            <ArrowRightIcon />
          </Link>
        </div>
      )}

      <div className="hidden lg:block">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildPageHref}
        />
      </div>
    </>
  );
}

/** Page size for the listing grid (matches the prior server-side `getCaseStudies` default). */
export const CASE_STUDIES_PAGE_SIZE = 9;

/** Client-safe paginate over the full card set (no other filters). */
export function selectCaseStudies(
  all: CaseStudy[],
  { page }: { page: number },
): { caseStudies: CaseStudy[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(all.length / CASE_STUDIES_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * CASE_STUDIES_PAGE_SIZE;
  return {
    caseStudies: all.slice(start, start + CASE_STUDIES_PAGE_SIZE),
    totalPages,
  };
}
