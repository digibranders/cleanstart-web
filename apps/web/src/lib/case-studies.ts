// Case Studies data layer — mirrors the resources.ts pattern.
// Listing-only collection: no detail route, downloads link straight to the
// public R2 asset URL.

import { cmsBaseUrl, fetchCMS } from "./cms-fetch";

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

export type CaseStudy = {
  id: string;
  title: string;
  slug: string;
  industry: CaseStudyIndustry;
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

export const CASE_STUDY_INDUSTRY_LABELS: Record<CaseStudyIndustry, string> = {
  healthcare: "Healthcare",
  telecom: "Telecom",
  finance: "Finance",
  technology: "Technology",
  manufacturing: "Manufacturing",
  other: "Other",
};

export function industryLabel(value: CaseStudyIndustry | null | undefined): string {
  if (!value) return "";
  return CASE_STUDY_INDUSTRY_LABELS[value] ?? "";
}

/** Resolve a CMS-relative media path to an absolute URL. R2 assets are already absolute. */
export function mediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${cmsBaseUrl()}${url}`;
}

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/zip": "ZIP",
  "application/x-zip-compressed": "ZIP",
};

/**
 * Build the card's file-meta label, e.g. `"PDF · 2.4 MB"`. Derives the type
 * from the media MIME and the size from `filesize` (bytes). Returns null when
 * the asset or its metadata is missing so callers can omit the line entirely.
 */
export function formatFileMeta(asset: CaseStudyMedia | null | undefined): string | null {
  if (!asset) return null;
  const typeLabel =
    (asset.mimeType && MIME_LABELS[asset.mimeType]) ??
    asset.filename?.split(".").pop()?.toUpperCase() ??
    "FILE";
  if (typeof asset.filesize !== "number" || asset.filesize <= 0) return typeLabel;
  const mb = asset.filesize / (1024 * 1024);
  const sizeLabel = mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  return `${typeLabel} · ${sizeLabel}`;
}

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
