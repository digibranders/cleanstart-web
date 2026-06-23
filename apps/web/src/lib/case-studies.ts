// Case Studies data layer — mirrors the resources.ts pattern.
// Listing-only collection: no detail route, downloads link straight to the
// public R2 asset URL.

import { fetchCMS } from "./cms-fetch";
import {
  CASE_STUDY_INDUSTRY_LABELS,
  formatFileMeta,
  industryLabel,
  mediaUrl,
} from "./case-studies-utils";

// Re-export the client-safe helpers (now defined in `case-studies-utils.ts`) so
// existing server-side imports from `lib/case-studies` keep working.
export { CASE_STUDY_INDUSTRY_LABELS, formatFileMeta, industryLabel, mediaUrl };

export type CaseStudyIndustry =
  | "healthcare"
  | "telecom"
  | "finance"
  | "technology"
  | "manufacturing"
  | "other";

export type CaseStudyMedia = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  filesize?: number;
  mimeType?: string;
  filename?: string;
};

/**
 * Industry taxonomy reference. Populated to a full term (depth ≥ 1) once the
 * `industryRef` relationship is backfilled in the CMS; until then it is
 * null/undefined and the display falls back to the legacy `industry` enum.
 */
export type IndustryRef = { id?: string; name?: string | null; slug?: string | null };

export type CaseStudy = {
  id: string;
  title: string;
  slug: string;
  industry: CaseStudyIndustry;
  industryRef?: IndustryRef | string | null;
  company: string;
  companyLogo?: CaseStudyMedia | null;
  coverImage?: CaseStudyMedia | null;
  summary: string;
  asset?: CaseStudyMedia | null;
  publishedAt?: string | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  nextPage?: number | null;
  page: number;
  totalPages: number;
};

export async function getCaseStudies({
  page = 1,
  limit = 9,
  industry,
}: {
  page?: number;
  limit?: number;
  industry?: CaseStudyIndustry | string;
} = {}): Promise<PayloadListResponse<CaseStudy>> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-publishedAt",
  });
  if (industry) params.set("where[industry][equals]", String(industry));
  return fetchCMS<PayloadListResponse<CaseStudy>>(
    `/api/case-studies?${params.toString()}`,
  );
}
