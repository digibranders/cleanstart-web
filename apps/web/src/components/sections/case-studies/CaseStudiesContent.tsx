import { CaseStudiesGrid } from "@/components/sections/case-studies/CaseStudiesGrid";
import { FadeUp } from "@/components/ui/FadeUp";
import type { CaseStudy } from "@/lib/case-studies";

export interface CaseStudiesContentProps {
  caseStudies: CaseStudy[];
  currentPage: number;
  totalPages: number;
  /** True when the CMS fetch failed (vs. a genuinely empty result). */
  loadFailed?: boolean;
}

/**
 * The filterable part of the /case-studies listing — only the paginated grid.
 * Rendered by the static page's Suspense fallback (server) and by
 * `CaseStudiesBrowser` (client). The page's hero + testimonials are rendered
 * separately, server-side, because they pull `BrandMarquee` (reads from disk
 * via `node:fs`) which cannot live in the client bundle.
 */
export function CaseStudiesContent({
  caseStudies,
  currentPage,
  totalPages,
  loadFailed = false,
}: CaseStudiesContentProps): React.ReactElement {
  return (
    <FadeUp>
      <CaseStudiesGrid
        caseStudies={caseStudies}
        currentPage={currentPage}
        totalPages={totalPages}
        loadFailed={loadFailed}
      />
    </FadeUp>
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
