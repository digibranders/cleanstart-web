import { describe, it, expect } from 'vitest';
import { mergeAndRankFeed, type FeedSource } from './latest-updates-feed';

const now = new Date('2026-06-01T00:00:00Z');

function src(type: FeedSource['type'], slug: string, publishedAt: string, extra: Partial<FeedSource> = {}): FeedSource {
  return { type, slug, title: slug, publishedAt, ...extra };
}

describe('mergeAndRankFeed — diversity-first ranking', () => {
  it('returns one item per category when 3+ categories have content (diversity pass)', () => {
    // The blog 'b1' is the NEWEST item overall — but we should NOT see two
    // blog cards. Diversity pass should pick newest blog + newest news +
    // newest resource, sorted by date.
    const out = mergeAndRankFeed(
      {
        blogs: [
          src('BLOG', 'b1', '2026-05-25'), // newest blog
          src('BLOG', 'b2', '2026-05-20'),
          src('BLOG', 'b3', '2026-05-15'),
        ],
        news: [src('NEWS', 'n1', '2026-05-22')],
        resources: [src('RESOURCE', 'r1', '2026-05-18')],
        webinars: [],
      },
      now,
    );
    // Expect one of each: blog (b1), news (n1), resource (r1). Order by date.
    expect(out.map((x) => x.slug)).toEqual(['b1', 'n1', 'r1']);
    // CRITICAL: b2 and b3 must NOT be in the result, even though b2 is newer
    // than r1. Diversity beats freshness when both can be satisfied.
    expect(out.find((x) => x.type === 'BLOG' && x.slug !== 'b1')).toBeUndefined();
  });

  it('includes an upcoming webinar if one exists (4 categories available)', () => {
    const out = mergeAndRankFeed(
      {
        blogs: [src('BLOG', 'b1', '2026-05-25')],
        news: [src('NEWS', 'n1', '2026-05-20')],
        resources: [src('RESOURCE', 'r1', '2026-05-18')],
        webinars: [
          { type: 'WEBINAR', slug: 'w1', title: 'w1', publishedAt: '2026-05-26', startsAt: '2026-06-15' },
        ],
      },
      now,
    );
    // 4 categories available, take top 3 by date.
    // w1 publishedAt is newest (5-26), then b1 (5-25), then n1 (5-20).
    expect(out.map((x) => x.slug)).toEqual(['w1', 'b1', 'n1']);
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

  it('falls back to next-newest from any source when fewer than 3 categories have content', () => {
    // Only 2 categories with content. After diversity pass we have b1, n1.
    // Need a 3rd — fall back to next-newest blog (b2).
    const out = mergeAndRankFeed(
      {
        blogs: [
          src('BLOG', 'b1', '2026-05-25'),
          src('BLOG', 'b2', '2026-05-20'),
          src('BLOG', 'b3', '2026-05-15'),
        ],
        news: [src('NEWS', 'n1', '2026-05-22')],
        resources: [],
        webinars: [],
      },
      now,
    );
    expect(out.map((x) => x.slug)).toEqual(['b1', 'n1', 'b2']);
  });

  it('returns 1 entry gracefully when only one category has a single item', () => {
    const out = mergeAndRankFeed(
      { blogs: [src('BLOG', 'only', '2026-05-01')], news: [], resources: [], webinars: [] },
      now,
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.slug).toBe('only');
  });

  it('returns empty when no content exists', () => {
    const out = mergeAndRankFeed(
      { blogs: [], news: [], resources: [], webinars: [] },
      now,
    );
    expect(out).toEqual([]);
  });

  it('finds the newest blog even when blogs are not pre-sorted (defensive)', () => {
    // Caller may not sort. Verify reduce-based newest() picks correctly.
    const out = mergeAndRankFeed(
      {
        blogs: [
          src('BLOG', 'older', '2026-05-01'),
          src('BLOG', 'newer', '2026-05-20'),
          src('BLOG', 'oldest', '2026-04-01'),
        ],
        news: [src('NEWS', 'n1', '2026-05-15')],
        resources: [src('RESOURCE', 'r1', '2026-05-10')],
        webinars: [],
      },
      now,
    );
    // Diversity pass: newer (newest blog), n1, r1. Sorted by date.
    expect(out.map((x) => x.slug)).toEqual(['newer', 'n1', 'r1']);
  });
});
