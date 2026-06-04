// Jobs data layer — reads from Payload `jobs` + `jobLocations` collections.
// Listing only surfaces records whose Payload `_status=published` AND
// `hiringStatus=open` (paused/closed roles never reach the marketing site).

import { cache } from "react";
import { fetchCMS } from "./cms-fetch";
import type { LexicalRoot } from "./blog";

export type JobDepartment =
  | "engineering"
  | "sales"
  | "marketing"
  | "customer-success"
  | "operations"
  | "finance"
  | "legal"
  | "people";

export type JobEmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship";

export type JobExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "staff"
  | "principal";

export type JobLocation = {
  id: number;
  name: string;
  slug: string;
  type: "country" | "region" | "city";
  isoCountry: string;
};

export type Job = {
  id: number;
  title: string;
  slug: string;
  source: "cms" | "ats";
  atsUrl?: string | null;
  department?: JobDepartment | null;
  employmentType?: JobEmploymentType | null;
  experienceLevel?: JobExperienceLevel | null;
  experienceRange?: string | null;
  locations?: (JobLocation | number)[] | null;
  remote?: boolean | null;
  applyUrl?: string | null;
  hiringStatus?: "open" | "paused" | "closed" | null;
  applicationDeadline?: string | null;
  expiresAt?: string | null;
  closedAt?: string | null;
  salaryRange?: {
    min?: number | null;
    max?: number | null;
    currency?: "USD" | "EUR" | "GBP" | "INR" | null;
  };
  body?: LexicalRoot | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  page: number;
  totalPages: number;
};

export const DEPARTMENT_LABEL: Record<JobDepartment, string> = {
  engineering: "Engineering",
  sales: "Sales",
  marketing: "Marketing",
  "customer-success": "Customer Success",
  operations: "Operations",
  finance: "Finance",
  legal: "Legal",
  people: "People",
};

export const EMPLOYMENT_TYPE_LABEL: Record<JobEmploymentType, string> = {
  "full-time": "Full-Time",
  "part-time": "Part-Time",
  contract: "Contract",
  internship: "Internship",
};

export const EXPERIENCE_LABEL: Record<JobExperienceLevel, string> = {
  entry: "Entry",
  mid: "Mid",
  senior: "Senior",
  staff: "Staff",
  principal: "Principal",
};

export type JobStatusFilter = "open" | "closed" | "all";

interface GetJobsArgs {
  page?: number;
  limit?: number;
  department?: string;
  location?: string;
  search?: string;
  /**
   * Hiring lifecycle filter for the public listing.
   * - "open" (default) — only roles currently accepting applications.
   * - "closed" — only roles that have been closed.
   * - "all" — open + closed (still excludes "paused", which is an admin-only
   *   state and should never appear publicly).
   */
  status?: JobStatusFilter;
}

export async function getJobs({
  page = 1,
  limit = 50,
  department,
  location,
  search,
  status = "open",
}: GetJobsArgs = {}): Promise<PayloadListResponse<Job>> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-updatedAt",
  });
  if (status === "open") {
    params.set("where[hiringStatus][equals]", "open");
  } else if (status === "closed") {
    params.set("where[hiringStatus][equals]", "closed");
  } else {
    // "all" — surface open + closed, but never paused (admin-only).
    params.set("where[hiringStatus][in]", "open,closed");
  }
  if (department) params.set("where[department][equals]", department);
  if (location) params.set("where[locations.slug][equals]", location);
  if (search) params.set("where[title][contains]", search);
  return fetchCMS<PayloadListResponse<Job>>(
    `/api/jobs?${params.toString()}`,
  );
}

export const getJobBySlug = cache(
  async (slug: string): Promise<Job | null> => {
    const params = new URLSearchParams({
      "where[slug][equals]": slug,
      "where[_status][equals]": "published",
      depth: "2",
      limit: "1",
    });
    const res = await fetchCMS<PayloadListResponse<Job>>(
      `/api/jobs?${params.toString()}`,
    );
    return res.docs[0] ?? null;
  },
);

export async function getJobLocations(): Promise<JobLocation[]> {
  const res = await fetchCMS<PayloadListResponse<JobLocation>>(
    "/api/jobLocations?limit=200&sort=name",
  );
  return res.docs;
}

/** Resolved locations array, ignoring any unresolved relationship IDs. */
export function resolvedLocations(job: Job): JobLocation[] {
  if (!job.locations) return [];
  return job.locations.filter(
    (entry): entry is JobLocation =>
      typeof entry === "object" && entry !== null && "name" in entry,
  );
}

export function locationDisplay(job: Job): string {
  const locs = resolvedLocations(job);
  if (locs.length === 0) return job.remote ? "Remote (Global)" : "—";
  return locs.map((l) => l.name).join(", ");
}

export function experienceDisplay(job: Job): string | null {
  // Prefer the human-readable year range from the original data
  // (e.g. "3-10 Years"); fall back to the bucketed enum label for
  // CMS-native jobs created without a range.
  if (job.experienceRange && job.experienceRange.trim().length > 0) {
    return job.experienceRange;
  }
  if (!job.experienceLevel) return null;
  return `${EXPERIENCE_LABEL[job.experienceLevel]} experience`;
}

export function applyHref(job: Job): string {
  if (job.source === "ats" && job.atsUrl) return job.atsUrl;
  if (job.applyUrl) return job.applyUrl;
  return `/job/${job.slug}`;
}

export type JobStatusBadge = "open" | "closing-soon" | "closed";

const CLOSING_SOON_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Returns the public-facing status badge for a job. Mirrors the patterns used
 * by mainstream career sites: open is implicit/green, "closing soon" surfaces
 * urgency when the application deadline is ≤14 days away, and closed roles
 * are explicitly marked.
 */
export function jobStatusBadge(job: Job): JobStatusBadge {
  if (job.hiringStatus === "closed") return "closed";
  if (job.applicationDeadline) {
    const dl = new Date(job.applicationDeadline).getTime();
    if (!Number.isNaN(dl)) {
      const delta = dl - Date.now();
      if (delta > 0 && delta <= CLOSING_SOON_WINDOW_MS) return "closing-soon";
    }
  }
  return "open";
}

export const JOB_STATUS_LABEL: Record<JobStatusBadge, string> = {
  open: "Open",
  "closing-soon": "Closing soon",
  closed: "Closed",
};
