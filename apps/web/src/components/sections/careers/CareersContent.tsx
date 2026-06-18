import { CareersHero } from "@/components/sections/careers/CareersHero";
import { CareersSidebar } from "@/components/sections/careers/CareersSidebar";
import { JobsList } from "@/components/sections/careers/JobsList";
import { FadeUp } from "@/components/ui/FadeUp";
import type { Job } from "@/lib/jobs";
import {
  DEPARTMENT_LABEL,
  resolvedLocations,
  type JobDepartment,
  type JobLocation,
  type JobStatusFilter,
} from "@/lib/jobs-utils";

export interface CareersContentProps {
  /** The current page of jobs after filter + pagination. */
  jobs: Job[];
  /** Department slugs that have at least one matching role (sidebar options). */
  availableDepartments: JobDepartment[];
  /** Location records that have at least one matching role attached. */
  availableLocations: JobLocation[];
  hasActiveFilter: boolean;
  activeDepartment: string;
  activeLocation: string;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
}

/**
 * Presentational body of the /careers listing — the hero (search), the grid
 * decorations, the filter sidebar, and the paginated job grid. Pure props, no
 * data fetching, so it renders identically on the server (static fallback) and
 * the client (`CareersBrowser`, which drives it from the URL filters). Keeping
 * it shared means the static HTML and the hydrated view are byte-identical for
 * the default (unfiltered, page 1) state — no hydration flash. See
 * `BlogsContent.tsx` for the pattern.
 */
export function CareersContent({
  jobs,
  availableDepartments,
  availableLocations,
  hasActiveFilter,
  activeDepartment,
  activeLocation,
  searchQuery,
  currentPage,
  totalPages,
}: CareersContentProps): React.ReactElement {
  return (
    <main id="main-content" style={{ background: "#f6f6f6" }}>
      <div className="relative overflow-hidden">
        <CareersHero initialQuery={searchQuery} />
      </div>

      <FadeUp>
        <section
          className="relative overflow-x-clip"
          style={{
            background: "#f6f6f6",
            paddingTop: "52px",
            paddingBottom: "120px",
          }}
          aria-label="Open roles"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute hidden md:block"
            style={{
              left: 0,
              top: 0,
              width: "560px",
              height: "420px",
              backgroundImage:
                "linear-gradient(to right, rgba(17,17,17,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.07) 1px, transparent 1px)",
              backgroundSize: "71px 71px",
              maskImage:
                "radial-gradient(ellipse at top left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at top left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 80%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute hidden md:block"
            style={{
              right: 0,
              top: 0,
              width: "560px",
              height: "420px",
              backgroundImage:
                "linear-gradient(to right, rgba(17,17,17,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.07) 1px, transparent 1px)",
              backgroundSize: "71px 71px",
              maskImage:
                "radial-gradient(ellipse at top right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at top right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 80%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              width: "1181px",
              height: "1181px",
              left: "-552px",
              top: "-413px",
              background:
                "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100,13,251,0) 100%)",
              opacity: 0.1,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              width: "1181px",
              height: "1181px",
              left: "calc(100% - 450px)",
              top: "-367px",
              background:
                "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100,13,251,0) 100%)",
              opacity: 0.1,
            }}
          />

          <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
            {/* `align-items: stretch` makes the nav column match the job
                list's height, giving the inner sticky card a tall enough
                parent to anchor against while scrolling. */}
            <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
              <CareersSidebar
                activeDepartment={activeDepartment}
                activeLocation={activeLocation}
                searchQuery={searchQuery}
                availableDepartments={availableDepartments}
                availableLocations={availableLocations}
              />

              <JobsList
                jobs={jobs}
                hasActiveFilter={hasActiveFilter}
                currentPage={currentPage}
                totalPages={totalPages}
                activeDepartment={activeDepartment}
                activeLocation={activeLocation}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        </section>
      </FadeUp>
    </main>
  );
}

/** Page size for the listing grid (matches the prior server-side pagination). */
export const JOBS_PAGE_SIZE = 50;

const DEPARTMENT_ORDER = Object.keys(DEPARTMENT_LABEL) as JobDepartment[];

interface SelectJobsArgs {
  department: string;
  location: string;
  search: string;
  status: JobStatusFilter;
  page: number;
}

export interface SelectJobsResult {
  jobs: Job[];
  totalPages: number;
  currentPage: number;
  hasActiveFilter: boolean;
  availableDepartments: JobDepartment[];
  availableLocations: JobLocation[];
}

/**
 * Client-safe filter + paginate over the full job set — the same selection the
 * server `getJobs` used to do, now in memory so the page can stay static.
 *
 * Mirrors the prior `getJobs` where-clauses exactly:
 * - `status` ("open" default | "closed" | "all") → `hiringStatus` equals /
 *   in (paused is never surfaced; the full set is already published-only).
 * - `department` → `department` equals.
 * - `location` → match if any resolved location's `slug` equals.
 * - `search` → case-insensitive `title` contains.
 *
 * Also derives the sidebar's available department / location options from the
 * status-filtered (but department/location/search-unfiltered) set, matching the
 * prior page's "second unfiltered query" behaviour.
 */
export function selectJobs(
  all: Job[],
  { department, location, search, status, page }: SelectJobsArgs,
  allLocations: JobLocation[],
): SelectJobsResult {
  const statusFiltered = all.filter((job) => matchesStatus(job, status));

  const availableDepartments = collectAvailableDepartments(statusFiltered);
  const availableLocations = collectAvailableLocations(
    statusFiltered,
    allLocations,
  );

  const q = search.trim().toLowerCase();
  const filtered = statusFiltered.filter((job) => {
    const departmentOk = !department || job.department === department;
    const locationOk =
      !location || resolvedLocations(job).some((l) => l.slug === location);
    const searchOk = !q || job.title.toLowerCase().includes(q);
    return departmentOk && locationOk && searchOk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / JOBS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * JOBS_PAGE_SIZE;

  return {
    jobs: filtered.slice(start, start + JOBS_PAGE_SIZE),
    totalPages,
    currentPage,
    hasActiveFilter: Boolean(department || location || search),
    availableDepartments,
    availableLocations,
  };
}

function matchesStatus(job: Job, status: JobStatusFilter): boolean {
  if (status === "open") return job.hiringStatus === "open";
  if (status === "closed") return job.hiringStatus === "closed";
  // "all" — open + closed, never paused (admin-only).
  return job.hiringStatus === "open" || job.hiringStatus === "closed";
}

function collectAvailableDepartments(jobs: Job[]): JobDepartment[] {
  const seen = new Set<JobDepartment>();
  for (const job of jobs) {
    if (job.department) seen.add(job.department);
  }
  return DEPARTMENT_ORDER.filter((d) => seen.has(d));
}

function collectAvailableLocations(
  jobs: Job[],
  allLocations: JobLocation[],
): JobLocation[] {
  const seenSlugs = new Set<string>();
  for (const job of jobs) {
    for (const loc of resolvedLocations(job)) {
      seenSlugs.add(loc.slug);
    }
  }
  return allLocations
    .filter((l) => seenSlugs.has(l.slug))
    .sort((a, b) => a.name.localeCompare(b.name));
}
