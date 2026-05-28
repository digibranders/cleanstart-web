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

export function mergeAndRankFeed(sources: Sources, now: Date = new Date()): FeedSource[] {
  const futureWebinars = sources.webinars.filter(
    (w) => !w.startsAt || new Date(w.startsAt) >= now,
  );
  const all = [...sources.blogs, ...sources.news, ...sources.resources, ...futureWebinars];
  return all
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 3);
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
