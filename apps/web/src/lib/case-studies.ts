// Case Studies data layer — mirrors the resources.ts pattern.
//
// Two shapes: `CaseStudy` is the card surface the listing reads, and
// `CaseStudyDetail` adds the fields only `/case-studies/[slug]` needs. The
// split keeps the listing's `limit=1000` fetch away from every study's Lexical
// body, which is what blew past Next's 2 MB data-cache ceiling on the
// resources listing (see the note on the select whitelist below).

import { cache } from "react";

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
  /** Editor's listing spotlight. Absent everywhere falls back to the newest. */
  featured?: boolean | null;
  quote?: string | null;
  quoteAuthor?: string | null;
  quoteRole?: string | null;
};

/** A headline figure on the detail hero's result card. */
export type CaseStudyOutcome = { value: string; label: string };

/** A row in the detail page's "At a glance" rail. */
export type CaseStudyGlanceFact = { label: string; value: string };

export type CaseStudyDetail = CaseStudy & {
  body?: import("./blog").LexicalRoot | null;
  outcomes?: CaseStudyOutcome[] | null;
  glance?: CaseStudyGlanceFact[] | null;
  seo?: import("./seo/cms-seo").CmsSeo | null;
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
    // depth=1 hydrates the uploads (companyLogo/coverImage/asset — the R2
    // adapter resolves upload URLs at depth=1; deeper is unresolved anyway) and
    // the `industryRef` term's name/slug. depth=2 with no select returned every
    // field, risking Next's 2 MB data-cache ceiling on the limit=1000 listing.
    depth: "1",
    limit: String(limit),
    page: String(page),
    sort: "-publishedAt",
  });
  // Whitelist the `CaseStudy` (card) field surface.
  for (const field of [
    "title",
    "slug",
    "industry",
    "industryRef",
    "company",
    "companyLogo",
    "coverImage",
    "summary",
    "asset",
    "publishedAt",
    "featured",
    "quote",
    "quoteAuthor",
    "quoteRole",
  ]) {
    params.set(`select[${field}]`, "true");
  }
  if (industry) params.set("where[industry][equals]", String(industry));
  return fetchCMS<PayloadListResponse<CaseStudy>>(
    `/api/case-studies?${params.toString()}`,
  );
}

/** All published case-study slugs, for `generateStaticParams` (scalar-only query). */
export async function getCaseStudySlugs(): Promise<string[]> {
  const res = await fetchCMS<PayloadListResponse<{ slug: string }>>(
    "/api/case-studies?where[_status][equals]=published&where[publishedAt][exists]=true&depth=0&limit=1000&select[slug]=true",
  );
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

/** One published case study by slug, with the detail-only fields. */
export const getCaseStudyBySlug = cache(
  async (slug: string): Promise<CaseStudyDetail | null> => {
    const data = await fetchCMS<PayloadListResponse<CaseStudyDetail>>(
      `/api/case-studies?where[slug][equals]=${encodeURIComponent(slug)}&where[_status][equals]=published&where[publishedAt][exists]=true&depth=1&limit=1`,
    );
    return data.docs[0] ?? null;
  },
);
