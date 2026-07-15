// Jobs data layer — reads from Payload `jobs` + `jobLocations` collections.
// Listing only surfaces records whose Payload `_status=published` AND
// `hiringStatus=open` (paused/closed roles never reach the marketing site).

import { cache } from "react";
import { fetchCMS } from "./cms-fetch";
import type { LexicalRoot } from "./blog";
import type { CmsSeo } from "./seo/cms-seo";
import type {
  JobDepartment,
  JobEmploymentType,
  JobExperienceLevel,
  JobLocation,
  JobStatusFilter,
} from "./jobs-utils";

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
  seo?: CmsSeo | null;
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
    // depth=1 + card-field whitelist. depth=2 with no select pulled every job's
    // full Lexical `body` + nested location chains (~723 KB / ~2 s); the cards
    // only read these fields. Filters use server-side `where` clauses, so the
    // filtered relationships don't need selecting.
    depth: "1",
    limit: String(limit),
    page: String(page),
    sort: "-updatedAt",
  });
  for (const field of [
    "title",
    "slug",
    "department",
    "employmentType",
    "hiringStatus",
    "experienceRange",
    "experienceLevel",
    "locations",
    "country",
    "seo",
    "updatedAt",
  ]) {
    params.set(`select[${field}]`, "true");
  }
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

// Shared loader. In draft mode the published filter is dropped so the preview
// route can render unpublished edits (cms-fetch authenticates the draft read).
async function loadJobBySlug(slug: string, draft = false): Promise<Job | null> {
  const params = new URLSearchParams({
    "where[slug][equals]": slug,
    depth: "2",
    limit: "1",
  });
  if (!draft) params.set("where[_status][equals]", "published");
  const res = await fetchCMS<PayloadListResponse<Job>>(
    `/api/jobs?${params.toString()}`,
    { draft },
  );
  return res.docs[0] ?? null;
}

export const getJobBySlug = cache(
  async (slug: string): Promise<Job | null> => loadJobBySlug(slug, false),
);

/** Draft variant for the `/preview/jobs/[slug]` route. Not cached. */
export async function getJobBySlugDraft(slug: string): Promise<Job | null> {
  return loadJobBySlug(slug, true);
}

export async function getJobLocations(): Promise<JobLocation[]> {
  const res = await fetchCMS<PayloadListResponse<JobLocation>>(
    "/api/jobLocations?limit=200&sort=name",
  );
  return res.docs;
}

/**
 * All published job slugs (open + closed), for generateStaticParams. Closed
 * roles are noindexed but still reachable from the careers "Closed roles"
 * filter, so prerender them too.
 */
export async function getJobSlugs(): Promise<string[]> {
  const res = await fetchCMS<PayloadListResponse<{ slug: string }>>(
    "/api/jobs?where[_status][equals]=published&depth=0&limit=1000&select[slug]=true",
  );
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

// Client-safe types + display helpers live in `jobs-utils.ts` (no `cms-fetch`
// / `next/headers`). Re-exported here for backward compat so existing
// server-side imports from `@/lib/jobs` keep resolving.
export type {
  JobDepartment,
  JobEmploymentType,
  JobExperienceLevel,
  JobLocation,
  JobStatusFilter,
  JobStatusBadge,
} from "./jobs-utils";
export {
  DEPARTMENT_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  EXPERIENCE_LABEL,
  JOB_STATUS_LABEL,
  resolvedLocations,
  locationDisplay,
  experienceDisplay,
  applyHref,
  jobStatusBadge,
} from "./jobs-utils";
