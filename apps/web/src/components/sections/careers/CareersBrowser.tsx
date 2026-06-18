"use client";

import { useSearchParams } from "next/navigation";
import {
  CareersContent,
  selectJobs,
} from "@/components/sections/careers/CareersContent";
import type { Job, JobLocation } from "@/lib/jobs";

interface CareersBrowserProps {
  allJobs: Job[];
  locations: JobLocation[];
}

/**
 * Client driver for the /careers listing. Reads the department / location /
 * search / page filters from the URL (`useSearchParams`) and filters the full
 * job set in memory, so the route stays statically rendered — the existing
 * `<Link>`-based sidebar filters and pagination become instant client-side URL
 * updates against the static page instead of per-request server renders.
 *
 * The public listing only ever surfaces open roles (no status param is
 * exposed in the URL), matching the prior server page's default. Must be
 * wrapped in a `<Suspense>` boundary by the page. See `BlogsBrowser.tsx`.
 */
export function CareersBrowser({
  allJobs,
  locations,
}: CareersBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const activeDepartment = params.get("department") ?? "";
  const activeLocation = params.get("location") ?? "";
  const searchQuery = params.get("q") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const result = selectJobs(
    allJobs,
    {
      department: activeDepartment,
      location: activeLocation,
      search: searchQuery,
      status: "open",
      page,
    },
    locations,
  );

  return (
    <CareersContent
      jobs={result.jobs}
      availableDepartments={result.availableDepartments}
      availableLocations={result.availableLocations}
      hasActiveFilter={result.hasActiveFilter}
      activeDepartment={activeDepartment}
      activeLocation={activeLocation}
      searchQuery={searchQuery}
      currentPage={result.currentPage}
      totalPages={result.totalPages}
    />
  );
}
