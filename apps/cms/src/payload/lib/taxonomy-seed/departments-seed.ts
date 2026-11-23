import type { TaxonomySeedTerm } from './industries-seed';

/**
 * Seed vocabulary for the `departments` taxonomy, mirroring the legacy
 * `jobs.department` select enum. `slug` equals the old enum value so existing
 * `?department=<value>` filter URLs keep resolving after the enum →
 * relationship promotion.
 *
 * A test (departments-seed.test.ts) asserts every frozen Jobs `department` enum
 * value has a seed row, so legacy jobs always resolve to a department. Rows
 * beyond the enum (IT) exist only as departments.
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
  { name: 'IT', slug: 'it' },
] as const;
