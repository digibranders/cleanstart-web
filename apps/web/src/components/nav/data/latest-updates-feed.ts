import { cache } from 'react';
import { getBlogs } from '@/lib/blog';
import { getNews } from '@/lib/news';
import { getResources } from '@/lib/resources';
import { getWebinars } from '@/lib/webinars';

export const LATEST_UPDATES_TAG = 'resources-latest-updates';

export type FeedSource = {
  type: 'BLOG' | 'NEWS' | 'RESOURCE' | 'WEBINAR';
  slug: string;
  title: string;
  publishedAt: string;
  readMinutes?: number;
  /** Only set on WEBINAR. */
  startsAt?: string;
};

type Sources = {
  blogs: FeedSource[];
  news: FeedSource[];
  resources: FeedSource[];
  webinars: FeedSource[];
};

/** Returns the newest item from an array (defensive — caller may not have sorted). */
function newest(arr: FeedSource[]): FeedSource | undefined {
  if (arr.length === 0) return undefined;
  return arr.reduce((best, x) =>
    (x.publishedAt ?? '').localeCompare(best.publishedAt ?? '') > 0 ? x : best,
  );
}

function dedupKey(s: FeedSource): string {
  return `${s.type}:${s.slug}`;
}

/**
 * Diversity-first ranking for the Resources → Latest Updates column.
 *
 * The 3-card feed exists to communicate **breadth of content streams**, not
 * just freshness. Pure sort-by-date can let one prolific source (typically the
 * engineering blog) monopolize all three slots, defeating the design intent.
 *
 * Algorithm:
 *   1. Filter webinars to upcoming-only (startsAt >= now, or missing).
 *   2. Pick the newest item from each of: blogs, news, resources, upcoming
 *      webinars. Sort that "one-per-category" set by publishedAt desc.
 *   3. If we have 3 or more distinct-category items, return the top 3.
 *   4. Otherwise (only 1–2 categories have content), top up with the
 *      next-newest from any source until we have 3 (or run out).
 *
 * This guarantees diversity when content allows AND avoids an empty feed when
 * it doesn't.
 */
export function mergeAndRankFeed(sources: Sources, now: Date = new Date()): FeedSource[] {
  const futureWebinars = sources.webinars.filter(
    (w) => !w.startsAt || new Date(w.startsAt) >= now,
  );

  // Pass 1: take the newest item from each available category.
  const diverse: FeedSource[] = [
    newest(sources.blogs),
    newest(sources.news),
    newest(sources.resources),
    newest(futureWebinars),
  ].filter((x): x is FeedSource => x !== undefined);

  const sortedDiverse = [...diverse].sort((a, b) =>
    (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
  );

  if (sortedDiverse.length >= 3) {
    return sortedDiverse.slice(0, 3);
  }

  // Pass 2: not enough categories — fall back to next-newest from any source.
  const used = new Set(sortedDiverse.map(dedupKey));
  const remaining = [
    ...sources.blogs,
    ...sources.news,
    ...sources.resources,
    ...futureWebinars,
  ]
    .filter((s) => !used.has(dedupKey(s)))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

  return [...sortedDiverse, ...remaining].slice(0, 3);
}

export const fetchLatestUpdates = cache(async (): Promise<FeedSource[]> => {
  try {
    const [blogs, news, resources, webinars] = await Promise.all([
      getBlogs({ limit: 4 }).then((r) =>
        (r.docs ?? []).map((d): FeedSource => {
          const out: FeedSource = {
            type: 'BLOG',
            slug: d.slug,
            title: d.title,
            // Blog uses `publishedAt` (string | undefined)
            publishedAt: d.publishedAt ?? '',
          };
          // Blog.readingMinutes is number | undefined
          if (typeof d.readingMinutes === 'number') {
            out.readMinutes = d.readingMinutes;
          }
          return out;
        }),
      ),
      getNews({ limit: 4 }).then((r) =>
        (r.docs ?? []).map((d): FeedSource => ({
          type: 'NEWS',
          slug: d.slug,
          title: d.title,
          // News uses `publicationDate` (not publishedAt) — string | null | undefined
          publishedAt: d.publicationDate ?? '',
        })),
      ),
      getResources({ limit: 4 }).then((r) =>
        (r.docs ?? []).map((d): FeedSource => ({
          type: 'RESOURCE',
          slug: d.slug,
          title: d.title,
          // Resource uses `publishedAt` (string | null | undefined)
          publishedAt: d.publishedAt ?? '',
        })),
      ),
      getWebinars({ limit: 4 }).then((r) =>
        (r.docs ?? []).map((d): FeedSource => {
          const out: FeedSource = {
            type: 'WEBINAR',
            slug: d.slug,
            title: d.title,
            // Webinar uses `publishedAt` (string | null | undefined)
            publishedAt: d.publishedAt ?? '',
          };
          // Webinar.startsAt is string | null | undefined
          if (typeof d.startsAt === 'string') {
            out.startsAt = d.startsAt;
          }
          return out;
        }),
      ),
    ]);
    return mergeAndRankFeed({ blogs, news, resources, webinars });
  } catch {
    return [];
  }
});
