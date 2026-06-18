// Client-safe job helpers extracted from `lib/jobs.ts` so client components
// (the static /careers listing's `CareersBrowser`/`CareersContent`/`JobCard`/
// `JobsList`/`CareersSidebar`) don't transitively pull `next/headers` via
// `cms-fetch`. Mirrors `blog-utils.ts` / `news-utils.ts` / `guides-utils.ts`.
//
// `jobs.ts` re-exports everything here for server-side backward compat. The
// types are declared here (the canonical home) and re-exported from `jobs.ts`;
// runtime values import the types type-only, so there is no runtime cycle.

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

// Structural subset of `Job` used by the display helpers below. Importing the
// full `Job` type from `jobs.ts` would create a type-level dependency back on
// the module these helpers are meant to keep out of the client bundle; the
// helpers only read these fields, so a local shape keeps the boundary clean.
export interface JobDisplayFields {
  title: string;
  slug: string;
  source: "cms" | "ats";
  atsUrl?: string | null;
  applyUrl?: string | null;
  department?: JobDepartment | null;
  employmentType?: JobEmploymentType | null;
  experienceLevel?: JobExperienceLevel | null;
  experienceRange?: string | null;
  locations?: (JobLocation | number)[] | null;
  remote?: boolean | null;
  hiringStatus?: "open" | "paused" | "closed" | null;
  applicationDeadline?: string | null;
}

export type JobStatusFilter = "open" | "closed" | "all";

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

/** Resolved locations array, ignoring any unresolved relationship IDs. */
export function resolvedLocations(job: JobDisplayFields): JobLocation[] {
  if (!job.locations) return [];
  return job.locations.filter(
    (entry): entry is JobLocation =>
      typeof entry === "object" && entry !== null && "name" in entry,
  );
}

export function locationDisplay(job: JobDisplayFields): string {
  const locs = resolvedLocations(job);
  if (locs.length === 0) return job.remote ? "Remote (Global)" : "—";
  return locs.map((l) => l.name).join(", ");
}

export function experienceDisplay(job: JobDisplayFields): string | null {
  // Prefer the human-readable year range from the original data
  // (e.g. "3-10 Years"); fall back to the bucketed enum label for
  // CMS-native jobs created without a range.
  if (job.experienceRange && job.experienceRange.trim().length > 0) {
    return job.experienceRange;
  }
  if (!job.experienceLevel) return null;
  return `${EXPERIENCE_LABEL[job.experienceLevel]} experience`;
}

export function applyHref(job: JobDisplayFields): string {
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
export function jobStatusBadge(job: JobDisplayFields): JobStatusBadge {
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
