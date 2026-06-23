import type { TaxonomySeedTerm } from './industries-seed';

/**
 * Seed vocabulary for the `resourceTypes` taxonomy, mirroring the legacy
 * `resources.type` select enum. `slug` equals the old enum value so existing
 * `?type=<value>` filter URLs keep resolving after the enum → relationship
 * promotion.
 *
 * A parity test (resource-types-seed.test.ts) asserts these slugs exactly
 * match the Resources `type` enum options, so the two can never drift.
 */
export const RESOURCE_TYPES_SEED: readonly TaxonomySeedTerm[] = [
  { name: 'Whitepaper', slug: 'whitepaper' },
  { name: 'Ebook', slug: 'ebook' },
  { name: 'Datasheet', slug: 'datasheet' },
  { name: 'Architecture Insights', slug: 'architecture-insights' },
  { name: 'Report', slug: 'report' },
] as const;
