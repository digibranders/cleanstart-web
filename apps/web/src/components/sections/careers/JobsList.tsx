import Link from "next/link";
import type { Job, JobStatusFilter } from "@/lib/jobs";
import { Pagination } from "@/components/ui/Pagination";
import { JobCard } from "./JobCard";

interface JobsListProps {
  jobs: Job[];
  hasActiveFilter: boolean;
  currentPage: number;
  totalPages: number;
  activeDepartment: string;
  activeLocation: string;
  activeStatus: JobStatusFilter;
  searchQuery: string;
}

function buildPageHref(
  page: number,
  activeDepartment: string,
  activeLocation: string,
  activeStatus: JobStatusFilter,
  searchQuery: string,
): string {
  const params = new URLSearchParams();
  if (activeDepartment) params.set("department", activeDepartment);
  if (activeLocation) params.set("location", activeLocation);
  if (activeStatus !== "open") params.set("status", activeStatus);
  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/careers?${qs}` : "/careers";
}

export function JobsList({
  jobs,
  hasActiveFilter,
  currentPage,
  totalPages,
  activeDepartment,
  activeLocation,
  activeStatus,
  searchQuery,
}: JobsListProps): React.ReactElement {
  if (jobs.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ minHeight: "320px" }}
      >
        <p
          className="text-center font-sans"
          style={{
            fontSize: "18px",
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            color: "rgba(17,17,17,0.54)",
          }}
        >
          No open roles match your filters.{" "}
          {hasActiveFilter ? (
            <Link href="/careers" className="text-[#4a3bf1] underline">
              Clear filters
            </Link>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(p) =>
          buildPageHref(
            p,
            activeDepartment,
            activeLocation,
            activeStatus,
            searchQuery,
          )
        }
      />
    </div>
  );
}
