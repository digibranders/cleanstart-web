import type { TaxonomySeedTerm } from './industries-seed';

/**
 * Seed vocabulary for the shared `regions` taxonomy — the UNION of the two
 * legacy region enums it replaces:
 *   News:     { north-america, apac }
 *   Webinars: { north-america, asia-mea, emea, global }
 * Seeding the union guarantees every existing value has a matching term, so
 * the backfill never drops data. `slug` equals the old enum value so existing
 * `?region=<value>` filter URLs keep resolving.
 *
 * A parity test (regions-seed.test.ts) asserts this set is a SUPERSET of both
 * enums, so a new region added to either collection can't silently lack a
 * term.
 */
export const REGIONS_SEED: readonly TaxonomySeedTerm[] = [
  { name: 'North America', slug: 'north-america' },
  { name: 'APAC', slug: 'apac' },
  { name: 'Asia & MEA', slug: 'asia-mea' },
  { name: 'EMEA', slug: 'emea' },
  { name: 'Global', slug: 'global' },
] as const;
