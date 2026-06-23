import type { TaxonomySeedTerm } from './industries-seed';

/**
 * Seed vocabulary for the `departments` taxonomy, mirroring the legacy
 * `jobs.department` select enum. `slug` equals the old enum value so existing
 * `?department=<value>` filter URLs keep resolving after the enum →
 * relationship promotion.
 *
 * A parity test (departments-seed.test.ts) asserts these slugs exactly match
 * the Jobs `department` enum options, so the two can never drift.
 */
export const DEPARTMENTS_SEED: readonly TaxonomySeedTerm[] = [
  { name: 'Engineering', slug: 'engineering' },
  { name: 'Sales', slug: 'sales' },
  { name: 'Marketing', slug: 'marketing' },
  { name: 'Customer Success', slug: 'customer-success' },
  { name: 'Operations', slug: 'operations' },
  { name: 'Finance', slug: 'finance' },
  { name: 'Legal', slug: 'legal' },
  { name: 'People', slug: 'people' },
] as const;
