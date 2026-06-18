// Client-safe guide helpers extracted from `lib/guides.ts` so client components
// (the static /guide listing's browser/card) don't transitively pull
// `next/headers` via `cms-fetch`. Mirrors `blog-utils.ts` / `news-utils.ts`.

const CMS_BASE = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export function guideMediaUrl(
  url: string | undefined | null,
): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${CMS_BASE}${url}`;
}

export function formatGuideDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
