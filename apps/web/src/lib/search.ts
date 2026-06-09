import { z } from 'zod';
import { fetchCMS } from './cms-fetch';

/**
 * Human label per indexed collection, shown as the type chip on each
 * result row. Mirrors the collections in the CMS `content` search index
 * (apps/cms/src/payload/lib/search/index-schema.ts).
 */
export const COLLECTION_LABELS: Record<string, string> = {
  blogs: 'Blog',
  news: 'News',
  guides: 'Guide',
  knowledgeBase: 'Knowledge Hub',
  resources: 'Resource',
  events: 'Event',
  webinars: 'Webinar',
  jobs: 'Career',
  podcastEpisodes: 'Podcast',
  authors: 'Author',
  pages: 'Page',
};

export const collectionLabel = (collection: string): string =>
  COLLECTION_LABELS[collection] ?? 'Result';

const cmsHitSchema = z.object({
  id: z.string(),
  collection: z.string(),
  title: z.string(),
  description: z.string().default(''),
  slug: z.string().optional(),
  url: z.string().optional(),
  categories: z.array(z.string()).default([]),
});

const cmsResponseSchema = z.object({
  ok: z.boolean().optional(),
  hits: z.array(cmsHitSchema).default([]),
  estimatedTotalHits: z.number().optional(),
});

/** A result row ready for the UI: link + label resolved, body stripped. */
export interface SearchHit {
  id: string;
  collection: string;
  label: string;
  title: string;
  description: string;
  href: string;
  categories: string[];
}

/**
 * The Meili doc stores an absolute production URL; the palette navigates
 * client-side, so reduce it to a same-origin path. Falls back to the raw
 * value if it isn't parseable (defensive — every indexed doc has a real
 * URL), and to a stable `#` only when no URL exists at all.
 */
const toRelativeHref = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return url.startsWith('/') ? url : null;
  }
};

export interface SearchOptions {
  q: string;
  collection?: string;
  limit?: number;
}

/**
 * Server-side search against the CMS `/api/search` endpoint (Meilisearch).
 * Returns UI-ready hits — only those with a resolvable link are kept, since
 * a result you can't open is noise in a command palette. Never throws: a
 * CMS/Meili outage degrades to an empty list so the palette shows
 * "no results" rather than an error.
 */
export async function searchContent(options: SearchOptions): Promise<SearchHit[]> {
  const q = options.q.trim();
  if (q.length === 0) return [];

  const params = new URLSearchParams({ q });
  if (options.collection) params.set('collection', options.collection);
  if (options.limit) params.set('limit', String(options.limit));

  let raw: unknown;
  try {
    raw = await fetchCMS<unknown>(`/api/search?${params.toString()}`, {
      revalidateSeconds: 30,
    });
  } catch {
    return [];
  }

  const parsed = cmsResponseSchema.safeParse(raw);
  if (!parsed.success) return [];

  const hits: SearchHit[] = [];
  for (const hit of parsed.data.hits) {
    const href = toRelativeHref(hit.url);
    if (!href) continue;
    hits.push({
      id: hit.id,
      collection: hit.collection,
      label: collectionLabel(hit.collection),
      title: hit.title,
      description: hit.description,
      href,
      categories: hit.categories,
    });
  }
  return hits;
}
