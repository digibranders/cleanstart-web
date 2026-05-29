import { cache } from "react";

import { cmsBaseUrl, fetchCMS } from "./cms-fetch";
import type { CmsSeo } from "./seo/cms-seo";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BlogAuthor = {
  id: string;
  name: string;
  slug?: string;
  photo?: BlogImage;
  bioShort?: string;
  role?: string;
  social?: {
    linkedin?: string;
  };
  linkedin?: string;
};

export type BlogImageSize = {
  url?: string | null;
  width?: number;
  height?: number;
};

export type BlogImage = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  sizes?: {
    thumb?: BlogImageSize;
    card?: BlogImageSize;
    hero?: BlogImageSize;
  };
};

export type Blog = {
  id: string;
  title: string;
  slug: string;
  abstract?: string;
  heroImage?: BlogImage;
  categories?: BlogCategory | null;
  authors?: BlogAuthor[];
  publishedAt?: string;
  displayPublishedAt?: string | null;
  updatedAt?: string;
  readingMinutes?: number;
  featured?: boolean;
  seo?: CmsSeo | null;
};

// Lexical rich-text node types from Payload CMS
export type LexicalTextNode = {
  type: "text";
  text: string;
  /** Bitmask: 1=bold 2=italic 4=strikethrough 8=underline 16=code 32=subscript 64=superscript */
  format?: number;
  version: number;
};

export type LexicalLinkNode = {
  type: "link" | "autolink";
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  children: LexicalNode[];
  version: number;
};

export type LexicalListItemNode = {
  type: "listitem";
  value: number;
  children: LexicalNode[];
  version: number;
};

export type LexicalListNode = {
  type: "list";
  listType: "bullet" | "number" | "check";
  children: LexicalListItemNode[];
  version: number;
};

export type LexicalHeadingNode = {
  type: "heading";
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: LexicalNode[];
  version: number;
};

export type LexicalQuoteNode = {
  type: "quote";
  children: LexicalNode[];
  version: number;
};

export type LexicalCodeNode = {
  type: "code";
  language?: string;
  children: LexicalNode[];
  version: number;
};

export type LexicalParagraphNode = {
  type: "paragraph";
  children: LexicalNode[];
  version: number;
  format?: string;
};

export type LexicalHorizontalRuleNode = {
  type: "horizontalrule";
  version: number;
};

export type LexicalUploadNode = {
  type: "upload";
  value?: { url?: string; alt?: string; width?: number; height?: number };
  version: number;
};

/**
 * headerState bitmask from Payload Lexical tables:
 *   0 = body cell, 1 = row header, 2 = column header, 3 = both
 */
export type LexicalTableCellNode = {
  type: "tablecell";
  headerState?: number;
  colSpan?: number;
  rowSpan?: number;
  children: LexicalNode[];
  version: number;
};

export type LexicalTableRowNode = {
  type: "tablerow";
  children: LexicalTableCellNode[];
  version: number;
};

export type LexicalTableNode = {
  type: "table";
  children: LexicalTableRowNode[];
  version: number;
};

export type LexicalNode =
  | LexicalTextNode
  | LexicalLinkNode
  | LexicalListNode
  | LexicalListItemNode
  | LexicalHeadingNode
  | LexicalQuoteNode
  | LexicalCodeNode
  | LexicalParagraphNode
  | LexicalHorizontalRuleNode
  | LexicalUploadNode
  | LexicalTableNode
  | LexicalTableRowNode
  | LexicalTableCellNode
  | { type: string; children?: LexicalNode[]; version: number; [key: string]: unknown };

export type LexicalRoot = {
  root: {
    type: string;
    children: LexicalNode[];
    direction: "ltr" | "rtl" | null;
    format: string;
    indent: number;
    version: number;
  };
};

export type TocEntry = {
  level?: number | null;
  text?: string | null;
  anchor?: string | null;
  id?: string | null;
};

export type BlogFaqItem = {
  id?: string;
  question: string;
  answer: string;
};

export type BlogDetail = Blog & {
  body?: LexicalRoot | null;
  tableOfContents?: TocEntry[] | null;
  relatedPosts?: Blog[] | null;
  previousPost?: Blog | string | null;
  nextPost?: Blog | string | null;
  faqs?: BlogFaqItem[] | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  nextPage?: number | null;
  page: number;
  totalPages: number;
};

// Payload returns relative URLs (e.g. /api/media/file/...) when serverURL isn't set.
// Prefix them so Next.js Image can resolve them against the CMS host, not the web app.
export function mediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${cmsBaseUrl()}${url}`;
}

// Prefer a generated size variant when present. Payload's Media collection
// can drift between its `url`/`filename` and the underlying R2 object (e.g. a
// slug/sanitize hook renames the doc but the storage object is not moved),
// leaving the canonical `url` 404'ing while the size variants — derived at
// upload time and never renamed — remain correct.
export function pickImageUrl(
  image: BlogImage | undefined | null,
  preferred: ReadonlyArray<"thumb" | "card" | "hero"> = ["card", "thumb", "hero"],
): string | undefined {
  if (!image) return undefined;
  for (const key of preferred) {
    const sized = image.sizes?.[key]?.url;
    if (sized) return mediaUrl(sized);
  }
  return mediaUrl(image.url);
}

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

export async function getFeaturedBlog(): Promise<Blog | null> {
  const featured = await fetchCMS<PayloadListResponse<Blog>>(
    `/api/blogs?${PUBLISHED_FILTER}&where[featured][equals]=true&depth=2&limit=1&sort=-publishedAt`,
  );
  if (featured.docs[0]) return featured.docs[0];

  const latest = await fetchCMS<PayloadListResponse<Blog>>(
    `/api/blogs?${PUBLISHED_FILTER}&depth=2&limit=1&sort=-publishedAt`,
  );
  return latest.docs[0] ?? null;
}

export async function getBlogs({
  page = 1,
  limit = 9,
  category,
  search,
}: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
} = {}): Promise<PayloadListResponse<Blog>> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-publishedAt",
  });
  if (category) {
    params.set("where[categories.slug][in][0]", category);
  }
  if (search) {
    params.set("where[title][contains]", search);
  }
  return fetchCMS<PayloadListResponse<Blog>>(`/api/blogs?${params.toString()}`);
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const data = await fetchCMS<PayloadListResponse<BlogCategory>>(
    "/api/categories?limit=100&sort=name",
  );
  return data.docs;
}

// Shared loader. When `draft` is true, the published-status filter is dropped
// on the CMS side (via `cms-fetch`) and authenticated draft reads are returned.
async function loadBlogBySlug(slug: string, draft = false): Promise<BlogDetail | null> {
  // In draft mode we cannot use the PUBLISHED_FILTER (it would hide drafts) —
  // `cms-fetch` strips it, but to keep the URL identical between modes we just
  // omit it here. Published reads still get the filter from PUBLISHED_FILTER.
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<BlogDetail>>(
    `/api/blogs?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=3&limit=1`,
    { draft },
  );
  const post = data.docs[0] ?? null;
  if (!post) return null;

  // Payload's R2/S3 storage adapter does not populate `url` for upload fields
  // nested beyond depth=1 (blog → author → photo). Re-fetch authors directly
  // at depth=1 so their photo.url is properly resolved.
  if (post.authors && post.authors.length > 0) {
    const idParams = post.authors
      .map((a, i) => `where[id][in][${i}]=${encodeURIComponent(a.id)}`)
      .join("&");
    try {
      const authorsData = await fetchCMS<PayloadListResponse<BlogAuthor>>(
        `/api/authors?${idParams}&depth=1&limit=10`,
        { draft },
      );
      const authorMap = new Map(authorsData.docs.map((a) => [a.id, a]));
      post.authors = post.authors.map((a) => authorMap.get(a.id) ?? a);
    } catch {
      // Non-fatal: fall back to the authors already embedded in the post
    }
  }

  return post;
}

export const getBlogBySlug = cache(
  async (slug: string): Promise<BlogDetail | null> => loadBlogBySlug(slug, false),
);

/**
 * Draft variant for the `/preview/blogs/[slug]` route. Not cached — every
 * preview render re-fetches so the editor sees their latest save immediately.
 */
export async function getBlogBySlugDraft(slug: string): Promise<BlogDetail | null> {
  return loadBlogBySlug(slug, true);
}

const RELATED_TARGET = 3;
// Fill queries overshoot the remaining-slots count so client-side dedupe
// against already-picked ids has headroom without a second round-trip.
const RELATED_FILL_OVERSHOOT = 5;

/**
 * Builds the Related Blogs grid for the blog detail page using a merge
 * strategy that honors editor intent first, then fills with freshness:
 *
 *   1. Curated `relatedPosts` (in editor order, published-only).
 *   2. Latest published in the same category, excluding self + already-picked.
 *   3. Latest published site-wide, excluding self + already-picked.
 *
 * Capped at 3. Curated picks are never re-sorted by date.
 *
 * `curated` accepts the raw `relatedPosts` field from the parent post —
 * Payload may return it as an array of ids (depth=0) or hydrated docs
 * (depth >= 1). Both shapes are handled.
 */
export async function getRelatedBlogs(
  blogId: string,
  categoryIds: string[],
  curated: Array<Blog | string | number> | null | undefined,
  { draft = false }: { draft?: boolean } = {},
): Promise<Blog[]> {
  const filter = draft ? "" : `${PUBLISHED_FILTER}&`;
  const picked: Blog[] = [];
  const excluded = new Set<string>([String(blogId)]);

  // 1. Curated. Fetch by id with the published filter so unpublished
  //    picks silently drop out and the fill stages compensate.
  //    `curated` may be hydrated docs (depth >= 1) or raw ids (depth=0);
  //    Payload's Postgres adapter uses numeric ids, normalize to string.
  const curatedIds = (curated ?? [])
    .map((c): string | null => {
      if (c == null) return null;
      if (typeof c === "object") return c.id != null ? String(c.id) : null;
      return String(c);
    })
    .filter((id): id is string => Boolean(id) && id !== String(blogId));

  if (curatedIds.length > 0) {
    const idParams = curatedIds
      .map((id, i) => `where[id][in][${i}]=${encodeURIComponent(id)}`)
      .join("&");
    const data = await fetchCMS<PayloadListResponse<Blog>>(
      `/api/blogs?${filter}${idParams}&depth=2&limit=${curatedIds.length}`,
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

  // 2. Category fill. Excludes only `blogId` server-side; remaining
  //    dedupe (against curated picks) happens client-side.
  if (categoryIds.length > 0) {
    const catParam = categoryIds
      .map((id, i) => `where[categories][in][${i}]=${encodeURIComponent(id)}`)
      .join("&");
    const remaining = RELATED_TARGET - picked.length;
    const data = await fetchCMS<PayloadListResponse<Blog>>(
      `/api/blogs?${filter}where[id][not_equals]=${encodeURIComponent(blogId)}&${catParam}&depth=2&limit=${remaining + RELATED_FILL_OVERSHOOT}&sort=-publishedAt`,
      { draft },
    );
    for (const doc of data.docs) {
      if (picked.length >= RELATED_TARGET) break;
      const id = String(doc.id);
      if (excluded.has(id)) continue;
      picked.push(doc);
      excluded.add(id);
    }
  }

  if (picked.length >= RELATED_TARGET) return picked;

  // 3. Site-wide fill.
  const remaining = RELATED_TARGET - picked.length;
  const data = await fetchCMS<PayloadListResponse<Blog>>(
    `/api/blogs?${filter}where[id][not_equals]=${encodeURIComponent(blogId)}&depth=2&limit=${remaining + RELATED_FILL_OVERSHOOT}&sort=-publishedAt`,
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
 * chronologically-adjacent blogs (by `publishedAt`), preferring the same
 * category and falling back to the full blog timeline when the category
 * has no neighbor on that side.
 *
 *   previous = latest published blog with `publishedAt < current.publishedAt`
 *   next     = earliest published blog with `publishedAt > current.publishedAt`
 *
 * Used by `/blog/[slug]` when the editor has left one or both journey fields
 * blank. Editorial intent (manual fields) always wins; this resolver is only
 * consulted for the unset side.
 *
 * Returns `{ previous: null, next: null }` when the current post has no
 * `publishedAt` (cannot anchor a chronological query).
 */
export async function getAutoJourneyTargets(
  currentId: string,
  publishedAt: string | undefined,
  categoryIds: string[],
  { draft = false }: { draft?: boolean } = {},
): Promise<{ previous: Blog | null; next: Blog | null }> {
  if (!publishedAt) return { previous: null, next: null };
  const filter = draft ? "" : `${PUBLISHED_FILTER}&`;
  const notSelf = `where[id][not_equals]=${encodeURIComponent(currentId)}`;
  const anchor = encodeURIComponent(publishedAt);

  const catParam =
    categoryIds.length > 0
      ? `&${categoryIds
          .map(
            (id, i) =>
              `where[categories][in][${i}]=${encodeURIComponent(id)}`,
          )
          .join("&")}`
      : "";

  // 1. Same-category neighbors (when categories are set). Two parallel queries.
  let previous: Blog | null = null;
  let next: Blog | null = null;
  if (categoryIds.length > 0) {
    const [prevCat, nextCat] = await Promise.all([
      fetchCMS<PayloadListResponse<Blog>>(
        `/api/blogs?${filter}${notSelf}&where[publishedAt][less_than]=${anchor}${catParam}&depth=2&limit=1&sort=-publishedAt`,
        { draft },
      ),
      fetchCMS<PayloadListResponse<Blog>>(
        `/api/blogs?${filter}${notSelf}&where[publishedAt][greater_than]=${anchor}${catParam}&depth=2&limit=1&sort=publishedAt`,
        { draft },
      ),
    ]);
    previous = prevCat.docs[0] ?? null;
    next = nextCat.docs[0] ?? null;
  }

  // 2. Site-wide fallback for either side that still has no neighbor.
  const fillTasks: Array<Promise<void>> = [];
  if (!previous) {
    fillTasks.push(
      fetchCMS<PayloadListResponse<Blog>>(
        `/api/blogs?${filter}${notSelf}&where[publishedAt][less_than]=${anchor}&depth=2&limit=1&sort=-publishedAt`,
        { draft },
      ).then((d) => {
        previous = d.docs[0] ?? null;
      }),
    );
  }
  if (!next) {
    fillTasks.push(
      fetchCMS<PayloadListResponse<Blog>>(
        `/api/blogs?${filter}${notSelf}&where[publishedAt][greater_than]=${anchor}&depth=2&limit=1&sort=publishedAt`,
        { draft },
      ).then((d) => {
        next = d.docs[0] ?? null;
      }),
    );
  }
  if (fillTasks.length > 0) await Promise.all(fillTasks);

  return { previous, next };
}

export function formatBlogDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
