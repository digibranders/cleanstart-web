import { cache } from "react";
import type { LexicalRoot } from "@/lib/blog";
import type { CmsSeo } from "@/lib/seo/cms-seo";
import { effectivePublishedAt } from "@/lib/published-date";
import { fetchCMS } from "./cms-fetch";

export type { LexicalRoot } from "@/lib/blog";

export interface LegalDoc {
  id: string;
  title: string;
  slug: string;
  order: number;
  icon: string;
  effectiveDate?: string | null;
  publishedAt?: string | null;
  displayPublishedAt?: string | null;
  updatedAt?: string | null;
  seo?: CmsSeo | null;
}

export interface LegalDocDetail extends LegalDoc {
  body?: LexicalRoot | null;
}

export interface PayloadListResponse<T> {
  docs: T[];
  totalDocs: number;
}

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

/** Sidebar + index list: published documents, ascending by `order`. */
export const getLegalList = cache(async (): Promise<LegalDoc[]> => {
  const data = await fetchCMS<PayloadListResponse<LegalDoc>>(
    `/api/legalDocuments?${PUBLISHED_FILTER}&sort=order&depth=0&limit=50`,
  );
  return data.docs;
});

async function loadLegalBySlug(
  slug: string,
  draft = false,
): Promise<LegalDocDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<LegalDocDetail>>(
    `/api/legalDocuments?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=1&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getLegalBySlug = cache(
  async (slug: string): Promise<LegalDocDetail | null> => loadLegalBySlug(slug, false),
);

/** Draft variant for the /preview/legal/[slug] route. Not cached. */
export async function getLegalBySlugDraft(slug: string): Promise<LegalDocDetail | null> {
  return loadLegalBySlug(slug, true);
}

/**
 * Slug of the Privacy Policy document. It lives in the `legalDocuments`
 * collection like every other legal doc, but its canonical public URL is the
 * standalone `/privacy-policy` (preserved from before the CMS migration — it is
 * indexed and linked from the footer, cookie banner, and consent forms), not
 * `/legal/privacy-policy`. The `/legal/privacy-policy` route permanently
 * redirects to it.
 */
export const PRIVACY_POLICY_SLUG = "privacy-policy";

/** Public URL for a legal document by slug (Privacy Policy keeps its own URL). */
export function legalHref(slug: string): string {
  return slug === PRIVACY_POLICY_SLUG ? "/privacy-policy" : `/legal/${slug}`;
}

/**
 * The legally operative date shown publicly as "Effective". Prefers the
 * editor-set `effectiveDate`; falls back to the publish-date chain so the hero
 * still renders a date for any legacy doc that predates the field.
 */
export function legalEffectiveDate(
  doc: Pick<LegalDoc, "effectiveDate" | "displayPublishedAt" | "publishedAt">,
): string | undefined {
  if (typeof doc.effectiveDate === "string" && doc.effectiveDate.length > 0) {
    return doc.effectiveDate;
  }
  return effectivePublishedAt(doc);
}

/** Renders e.g. "June 4, 2026". */
export function formatLegalDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
