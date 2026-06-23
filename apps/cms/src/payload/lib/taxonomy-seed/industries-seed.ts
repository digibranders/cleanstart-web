/**
 * Seed vocabulary for the `industries` taxonomy, mirroring the legacy
 * `case-studies.industry` select enum. `slug` equals the old enum value so
 * existing `?industry=<value>` filter URLs keep resolving after the
 * enum → relationship promotion.
 *
 * Consumed by scripts/seed-industries.ts. A parity test
 * (industries-seed.test.ts) asserts these slugs exactly match the
 * CaseStudies `industry` enum options, so the two can never drift.
 */
export interface TaxonomySeedTerm {
  readonly name: string;
  readonly slug: string;
}

export const INDUSTRIES_SEED: readonly TaxonomySeedTerm[] = [
  { name: 'Healthcare', slug: 'healthcare' },
  { name: 'Telecom', slug: 'telecom' },
  { name: 'Finance', slug: 'finance' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Manufacturing', slug: 'manufacturing' },
  { name: 'Other', slug: 'other' },
] as const;
