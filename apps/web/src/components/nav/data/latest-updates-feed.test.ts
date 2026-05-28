import { describe, it, expect } from 'vitest';
import { mergeAndRankFeed, type FeedSource } from './latest-updates-feed';

const now = new Date('2026-06-01T00:00:00Z');

function src(type: FeedSource['type'], slug: string, publishedAt: string, extra: Partial<FeedSource> = {}): FeedSource {
  return { type, slug, title: slug, publishedAt, ...extra };
}

describe('mergeAndRankFeed', () => {
  it('returns top 3 by publishedAt desc', () => {
    const out = mergeAndRankFeed(
      {
        blogs: [src('BLOG', 'b1', '2026-05-01'), src('BLOG', 'b2', '2026-05-20')],
        news: [src('NEWS', 'n1', '2026-05-15')],
        resources: [src('RESOURCE', 'r1', '2026-05-10')],
        webinars: [],
      },
      now,
    );
    expect(out.map((x) => x.slug)).toEqual(['b2', 'n1', 'r1']);
  });

  it('omits webinars whose startsAt is in the past', () => {
    const out = mergeAndRankFeed(
      {
        blogs: [src('BLOG', 'b1', '2026-05-01')],
        news: [src('NEWS', 'n1', '2026-04-01')],
        resources: [],
        webinars: [
          { type: 'WEBINAR', slug: 'past', title: 'past', publishedAt: '2026-05-25', startsAt: '2026-05-10' },
          { type: 'WEBINAR', slug: 'future', title: 'future', publishedAt: '2026-05-26', startsAt: '2026-06-15' },
        ],
      },
      now,
    );
    expect(out.find((x) => x.slug === 'past')).toBeUndefined();
    expect(out.find((x) => x.slug === 'future')).toBeDefined();
  });

  it('returns fewer than 3 entries gracefully when the union is small', () => {
    const out = mergeAndRankFeed(
      { blogs: [src('BLOG', 'only', '2026-05-01')], news: [], resources: [], webinars: [] },
      now,
    );
    expect(out).toHaveLength(1);
  });
});
