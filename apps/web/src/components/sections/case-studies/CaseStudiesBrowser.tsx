"use client";

import { useSearchParams } from "next/navigation";
import {
  CaseStudiesContent,
  selectCaseStudies,
} from "@/components/sections/case-studies/CaseStudiesContent";
import type { CaseStudy } from "@/lib/case-studies";

interface CaseStudiesBrowserProps {
  allCaseStudies: CaseStudy[];
  loadFailed?: boolean;
}

/**
 * Client driver for the /case-studies listing — reads the `page` param from the
 * URL and paginates the full set in memory so the route stays static. Must be
 * wrapped in `<Suspense>` by the page. See `BlogsBrowser.tsx`.
 */
export function CaseStudiesBrowser({
  allCaseStudies,
  loadFailed = false,
}: CaseStudiesBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const { caseStudies, totalPages } = selectCaseStudies(allCaseStudies, { page });

  return (
    <CaseStudiesContent
      caseStudies={caseStudies}
      currentPage={Math.min(page, totalPages)}
      totalPages={totalPages}
      loadFailed={loadFailed}
    />
  );
}
