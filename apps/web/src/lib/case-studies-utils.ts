// Client-safe case-studies helpers extracted from `lib/case-studies.ts` so client
// components (e.g. the static /case-studies listing's `CaseStudiesBrowser`/
// `CaseStudyCard`) don't transitively pull `next/headers` via `cms-fetch`.
// Mirrors `blog-utils.ts`.
//
// Type-only import — erased at runtime, so this does not create a runtime cycle
// with `case-studies.ts` (which re-exports these for server-side backward compat).
import type { CaseStudyIndustry, CaseStudyMedia } from "./case-studies";

// `NEXT_PUBLIC_CMS_URL` is inlined at build time, so this is safe on the client
// (matches `cmsBaseUrl()` in `cms-fetch`, which we can't import here — it pulls
// `next/headers`).
const CMS_BASE = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

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
  return `${CMS_BASE}${url}`;
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
