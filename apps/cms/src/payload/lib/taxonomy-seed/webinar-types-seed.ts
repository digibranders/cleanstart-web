import type { TaxonomySeedTerm } from './industries-seed';

/**
 * Seed vocabulary for the `webinarTypes` taxonomy, mirroring the legacy
 * `webinars.webinarType` select enum. `slug` equals the old enum value so
 * existing `?type=<value>` filter URLs keep resolving after the enum →
 * relationship promotion.
 *
 * A parity test (webinar-types-seed.test.ts) asserts these slugs exactly
 * match the Webinars `webinarType` enum options, so the two can never drift.
 */
export const WEBINAR_TYPES_SEED: readonly TaxonomySeedTerm[] = [
  { name: 'Live', slug: 'live' },
  { name: 'On-demand', slug: 'on-demand' },
  { name: 'Panel', slug: 'panel' },
  { name: 'Demo', slug: 'demo' },
] as const;
