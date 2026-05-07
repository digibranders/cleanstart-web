import type { JsonLdContext } from './context';
import { onlyResolved } from './shared';
import type { JsonLdBlob } from './types';

/**
 * Resolved `jobLocations` shape after Payload depth=2 resolution.
 */
export interface JobLocationSource {
  readonly name?: string | null;
  /** ISO 3166-1 alpha-2, e.g. "IN", "US". */
  readonly isoCountry?: string | null;
  /** city / region / country — used to pick PostalAddress shape. */
  readonly type?: 'city' | 'region' | 'country' | null;
}

/** Schema.org employmentType enum tokens. */
type EmploymentTypeToken =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACTOR'
  | 'INTERN';

const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentTypeToken> = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
};

export interface JobSalaryRange {
  readonly min?: number | null;
  readonly max?: number | null;
  readonly currency?: string | null;
}

export interface JobPostingSource {
  /** Canonical absolute URL — used for both `@id` and `url`. */
  readonly url: string;
  readonly title: string;
  /**
   * Plain-text description. Schema.org requires this. Caller passes
   * the result of running `extractFromLexical` over the body, or the
   * abstract / title fallback.
   */
  readonly description: string;
  readonly datePosted: string;
  /** Closing date for applications — feeds Google's `validThrough`. */
  readonly validThrough?: string | null;
  /** Payload's `employmentType` select value (full-time | part-time | …). */
  readonly employmentType?: string | null;
  readonly remote?: boolean;
  readonly locations?: readonly (JobLocationSource | number | null | undefined)[] | null;
  /** Senior / staff / etc. Surfaced as `experienceRequirements` text. */
  readonly experienceLevel?: string | null;
  readonly salary?: JobSalaryRange | null;
  /** Apply URL — `applyUrl` for cms-source jobs, `atsUrl` for ats-source. */
  readonly applyUrl?: string | null;
  /** Hiring lifecycle. Closed jobs emit no JobPosting (filtered by caller). */
  readonly hiringStatus?: 'open' | 'paused' | 'closed';
}

const buildJobLocation = (
  loc: JobLocationSource,
): Record<string, unknown> | null => {
  if (!loc.name) return null;
  const address: Record<string, unknown> = {
    '@type': 'PostalAddress',
  };
  switch (loc.type) {
    case 'city':
      address.addressLocality = loc.name;
      break;
    case 'region':
      address.addressRegion = loc.name;
      break;
    default:
      // 'country' (or unset / unknown). Country-level rows put the
      // name into addressCountry directly; Google still accepts the
      // 2-letter code below.
      address.addressCountry = loc.isoCountry ?? loc.name;
      break;
  }
  if (loc.isoCountry && loc.type !== 'country') {
    address.addressCountry = loc.isoCountry;
  }
  return {
    '@type': 'Place',
    address,
  };
};

const buildSalary = (
  salary: JobSalaryRange | null | undefined,
): Record<string, unknown> | null => {
  if (!salary) return null;
  const hasMin = typeof salary.min === 'number';
  const hasMax = typeof salary.max === 'number';
  if (!hasMin && !hasMax) return null;

  const value: Record<string, unknown> = {
    '@type': 'QuantitativeValue',
    unitText: 'YEAR',
  };
  if (hasMin && hasMax && salary.min !== salary.max) {
    value.minValue = salary.min;
    value.maxValue = salary.max;
  } else {
    value.value = salary.min ?? salary.max;
  }

  return {
    '@type': 'MonetaryAmount',
    currency: salary.currency ?? 'USD',
    value,
  };
};

/**
 * Schema.org JobPosting blob. Returns null when the schema.org-required
 * fields (title, description, datePosted) aren't all present, or when
 * the role isn't currently open — Google's JobPosting guidelines warn
 * that closed listings should not emit JobPosting markup.
 */
export const buildJobPostingBlob = (
  ctx: JsonLdContext,
  source: JobPostingSource,
): JsonLdBlob | null => {
  if (source.hiringStatus === 'closed') return null;
  if (!source.title || !source.description || !source.datePosted || !source.url) {
    return null;
  }

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    '@id': source.url,
    url: source.url,
    title: source.title,
    description: source.description,
    datePosted: source.datePosted,
    hiringOrganization: { '@id': ctx.organizationId },
  };

  if (source.validThrough) blob.validThrough = source.validThrough;

  const employmentToken = source.employmentType
    ? EMPLOYMENT_TYPE_MAP[source.employmentType] ?? null
    : null;
  if (employmentToken) blob.employmentType = employmentToken;

  if (source.remote) {
    blob.jobLocationType = 'TELECOMMUTE';
  }

  const resolvedLocations = onlyResolved(
    source.locations as
      | readonly (Record<string, unknown> | number | null | undefined)[]
      | null,
  ) as JobLocationSource[];
  const places = resolvedLocations
    .map(buildJobLocation)
    .filter((p): p is Record<string, unknown> => p !== null);
  if (places.length > 0) {
    blob.jobLocation = places.length === 1 ? places[0] : places;
  }

  if (source.experienceLevel) {
    blob.experienceRequirements = source.experienceLevel;
  }

  const salary = buildSalary(source.salary);
  if (salary) blob.baseSalary = salary;

  if (source.applyUrl) {
    blob.applicantContact = {
      '@type': 'ContactPoint',
      url: source.applyUrl,
    };
  }

  return blob as JsonLdBlob;
};
