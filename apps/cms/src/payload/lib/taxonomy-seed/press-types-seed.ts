import type { TaxonomySeedTerm } from './industries-seed';

/**
 * Seed vocabulary for the `pressTypes` taxonomy, mirroring the legacy
 * `news.pressType` select enum. `slug` equals the old enum value so existing
 * `?type=<value>` filter URLs keep resolving after the enum → relationship
 * promotion.
 *
 * A parity test (press-types-seed.test.ts) asserts these slugs exactly match
 * the News `pressType` enum options, so the two can never drift.
 */
export const PRESS_TYPES_SEED: readonly TaxonomySeedTerm[] = [
  { name: 'Press Release', slug: 'press-release' },
  { name: 'News', slug: 'news' },
  { name: 'Announcement', slug: 'announcement' },
  { name: 'Feature', slug: 'feature' },
] as const;
