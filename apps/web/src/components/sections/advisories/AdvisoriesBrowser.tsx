"use client";

import { useSearchParams } from "next/navigation";
import { AdvisoriesTable } from "@/components/sections/advisories/AdvisoriesTable";
import { selectAdvisories, type AdvisoryRow } from "@/lib/advisory-utils";

/**
 * Client driver for /advisories: reads `technology`, `status` and `q` from the
 * URL and filters the full set in memory, so the route stays static. Must sit
 * inside a `<Suspense>` boundary; see `BlogsBrowser.tsx`.
 */
export function AdvisoriesBrowser({
  allAdvisories,
  technologies,
}: {
  allAdvisories: AdvisoryRow[];
  technologies: ReadonlyArray<{ value: string; label: string }>;
}): React.ReactElement {
  const params = useSearchParams();
  const filters = {
    technology: params.get("technology") ?? "",
    status: params.get("status") ?? "",
    q: params.get("q") ?? "",
  };
  return (
    <AdvisoriesTable
      rows={selectAdvisories(allAdvisories, filters)}
      technologies={technologies}
      filters={filters}
    />
  );
}
