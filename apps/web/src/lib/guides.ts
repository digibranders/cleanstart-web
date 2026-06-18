import { cache } from "react";
import type { BlogAuthor, BlogImage, LexicalRoot, TocEntry } from "@/lib/blog";
import type { CmsSeo } from "@/lib/seo/cms-seo";

import { fetchCMS } from "./cms-fetch";
import { formatGuideDate, guideMediaUrl } from "./guides-utils";

export type { LexicalRoot, TocEntry } from "@/lib/blog";

export type GuideImage = BlogImage;
export type GuideAuthor = BlogAuthor;

export type GuideFaqItem = {
  id?: string;
  question: string;
  answer: string;
};

export type Guide = {
  id: string;
  title: string;
  slug: string;
  abstract?: string | null;
  heroImage?: GuideImage | null;
  authors?: BlogAuthor[] | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingMinutes?: number | null;
  seo?: CmsSeo | null;
};

export type GuideDetail = Guide & {
  body?: LexicalRoot | null;
  tableOfContents?: TocEntry[] | null;
  tocDepth?: "h2" | "h2_h3" | "h2_h3_h4" | null;
  faqs?: GuideFaqItem[] | null;
  previousGuide?: Guide | string | number | null;
  nextGuide?: Guide | string | number | null;
  relatedGuides?: Array<Guide | string | number> | null;
};

export type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
};

/**
 * Listing fetch for the `/guide` page. Published-only, newest first.
 * Optional `search` matches the guide title (case-insensitive contains).
 * No category filter — the guides collection has no category taxonomy.
 */
export async function getGuides({
  page = 1,
  limit = 16,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PayloadListResponse<Guide>> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    // depth=1 + a card-field whitelist. depth=2 with no select pulled every
    // guide's full Lexical `body` (guides run 8–13 MB each) — a single listing
    // page ballooned past 80 MB / 12 s, far over Next's 2 MB data-cache ceiling,
    // so it was never cached and re-fetched on every request (the ~6 s /guide
    // load). Cards only read these fields.
    depth: "1",
    limit: String(limit),
    page: String(page),
    sort: "-publishedAt",
  });
  for (const field of [
    "title",
    "slug",
    "abstract",
    "heroImage",
    "publishedAt",
    "updatedAt",
    "readingMinutes",
    "seo",
  ]) {
    params.set(`select[${field}]`, "true");
  }
  if (search) params.set("where[title][contains]", search);
  return fetchCMS<PayloadListResponse<Guide>>(`/api/guides?${params.toString()}`);
}

// `formatGuideDate` / `guideMediaUrl` live in `guides-utils.ts` (no cms-fetch /
// next/headers) so client components can import them. Re-exported for server callers.
export { formatGuideDate, guideMediaUrl };

/**
 * Prefer a generated size variant when present, falling back to the canonical
 * url. Guards against the Payload/R2 drift where a renamed Media doc leaves
 * `url` 404'ing while the upload-time size variants stay correct.
 */
export function guidePickImageUrl(
  image: GuideImage | undefined | null,
  preferred: ReadonlyArray<"thumb" | "card" | "hero"> = ["card", "thumb", "hero"],
): string | undefined {
  if (!image) return undefined;
  for (const key of preferred) {
    const sized = image.sizes?.[key]?.url;
    if (sized) return guideMediaUrl(sized);
  }
  return guideMediaUrl(image.url);
}

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

/** All published guide slugs, for `generateStaticParams` (scalar-only query). */
export async function getGuideSlugs(): Promise<string[]> {
  const res = await fetchCMS<PayloadListResponse<{ slug: string }>>(
    `/api/guides?${PUBLISHED_FILTER}&depth=0&limit=1000&select[slug]=true`,
  );
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

// Shared loader. In draft mode the published filter is dropped so the preview
// route can render unpublished edits (cms-fetch authenticates the draft read).
async function loadGuideBySlug(
  slug: string,
  draft = false,
): Promise<GuideDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<GuideDetail>>(
    `/api/guides?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=1&limit=1`,
    { draft },
  );
  const guide = data.docs[0] ?? null;
  if (!guide) return null;

  // Payload's R2/S3 adapter does not populate `url` for upload fields nested
  // beyond depth=1 (guide → author → photo). Re-fetch authors at depth=1 so
  // their photo.url resolves for the hero + author-bio cards.
  if (guide.authors && guide.authors.length > 0) {
    const idParams = guide.authors
      .map((a, i) => `where[id][in][${i}]=${encodeURIComponent(a.id)}`)
      .join("&");
    try {
      const authorsData = await fetchCMS<PayloadListResponse<GuideAuthor>>(
        `/api/authors?${idParams}&depth=1&limit=10`,
        { draft },
      );
      const authorMap = new Map(authorsData.docs.map((a) => [a.id, a]));
      guide.authors = guide.authors.map((a) => authorMap.get(a.id) ?? a);
    } catch {
      // Non-fatal: fall back to the authors already embedded in the guide.
    }
  }

  return guide;
}

const RELATED_TARGET = 3;
// Overshoot the remaining-slots count so client-side dedupe against
// already-picked ids has headroom without a second round-trip.
const RELATED_FILL_OVERSHOOT = 5;

// Card-only field projection for related/journey list queries. Excludes the
// Lexical `body` — a guide body can be multiple MB, and 6 of them exceed
// Next's 2 MB Data-Cache ceiling (the response is then never cached, so every
// ISR regen re-fetches it). Cards only render these fields.
const RELATED_CARD_SELECT =
  "select[title]=true&select[slug]=true&select[heroImage]=true&select[abstract]=true&select[readingMinutes]=true";
const JOURNEY_SELECT = "select[title]=true&select[slug]=true";

/**
 * Builds the Related Guides grid: curated `relatedGuides` picks first (in
 * editor order, published-only), then site-wide fill with the most-recent
 * guides excluding self + already-picked. Capped at 3. Guides have no
 * category, so there is no category-fill stage (unlike blogs).
 */
export async function getRelatedGuides(
  guideId: string,
  curated: Array<Guide | string | number> | null | undefined,
  { draft = false }: { draft?: boolean } = {},
): Promise<Guide[]> {
  const filter = draft ? "" : `${PUBLISHED_FILTER}&`;
  const picked: Guide[] = [];
  const excluded = new Set<string>([String(guideId)]);

  const curatedIds = (curated ?? [])
    .map((c): string | null => {
      if (c == null) return null;
      if (typeof c === "object") return c.id != null ? String(c.id) : null;
      return String(c);
    })
    .filter((id): id is string => Boolean(id) && id !== String(guideId));

  if (curatedIds.length > 0) {
    const idParams = curatedIds
      .map((id, i) => `where[id][in][${i}]=${encodeURIComponent(id)}`)
      .join("&");
    const data = await fetchCMS<PayloadListResponse<Guide>>(
      `/api/guides?${filter}${idParams}&depth=1&${RELATED_CARD_SELECT}&limit=${curatedIds.length}`,
      { draft },
    );
    const byId = new Map(data.docs.map((d) => [String(d.id), d]));
    for (const id of curatedIds) {
      if (picked.length >= RELATED_TARGET) break;
      const doc = byId.get(id);
      if (doc && !excluded.has(String(doc.id))) {
        picked.push(doc);
        excluded.add(String(doc.id));
      }
    }
  }

  if (picked.length >= RELATED_TARGET) return picked;

  // Site-wide fill (no category stage for guides).
  const remaining = RELATED_TARGET - picked.length;
  const data = await fetchCMS<PayloadListResponse<Guide>>(
    `/api/guides?${filter}where[id][not_equals]=${encodeURIComponent(guideId)}&depth=1&${RELATED_CARD_SELECT}&limit=${remaining + RELATED_FILL_OVERSHOOT}&sort=-publishedAt`,
    { draft },
  );
  for (const doc of data.docs) {
    if (picked.length >= RELATED_TARGET) break;
    const id = String(doc.id);
    if (excluded.has(id)) continue;
    picked.push(doc);
    excluded.add(id);
  }

  return picked;
}

/**
 * Auto fallback for the editorial Previous/Next pagination. Returns the
 * chronologically-adjacent guides by `publishedAt`:
 *
 *   previous = latest published guide with `publishedAt < current`
 *   next     = earliest published guide with `publishedAt > current`
 *
 * Consulted only for the side(s) the editor left blank. Returns nulls when the
 * current guide has no `publishedAt` to anchor the query.
 */
export async function getGuideJourneyTargets(
  currentId: string,
  publishedAt: string | undefined,
  { draft = false }: { draft?: boolean } = {},
): Promise<{ previous: Guide | null; next: Guide | null }> {
  if (!publishedAt) return { previous: null, next: null };
  const filter = draft ? "" : `${PUBLISHED_FILTER}&`;
  const notSelf = `where[id][not_equals]=${encodeURIComponent(currentId)}`;
  const anchor = encodeURIComponent(publishedAt);

  const [prev, next] = await Promise.all([
    fetchCMS<PayloadListResponse<Guide>>(
      `/api/guides?${filter}${notSelf}&where[publishedAt][less_than]=${anchor}&depth=1&${JOURNEY_SELECT}&limit=1&sort=-publishedAt`,
      { draft },
    ),
    fetchCMS<PayloadListResponse<Guide>>(
      `/api/guides?${filter}${notSelf}&where[publishedAt][greater_than]=${anchor}&depth=1&${JOURNEY_SELECT}&limit=1&sort=publishedAt`,
      { draft },
    ),
  ]);

  return { previous: prev.docs[0] ?? null, next: next.docs[0] ?? null };
}

export const getGuideBySlug = cache(
  async (slug: string): Promise<GuideDetail | null> => loadGuideBySlug(slug, false),
);

/** Draft variant for the `/preview/guides/[slug]` route. Not cached. */
export async function getGuideBySlugDraft(
  slug: string,
): Promise<GuideDetail | null> {
  return loadGuideBySlug(slug, true);
}
