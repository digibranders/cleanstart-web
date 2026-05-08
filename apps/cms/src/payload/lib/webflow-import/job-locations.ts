/**
 * Webflow Job Locations stored only Name + Slug. Payload's
 * `jobLocations` collection has structured `timezone`, `isoCountry`,
 * and `type` fields.
 *
 * The migration uses this resolver to populate the structured fields
 * from the bare Webflow name. We hand-curate the lookup table — the
 * collection has only 6 rows in the live Webflow CMS, so the table
 * stays a fixed size for the foreseeable future. Unknown names default
 * to country-level + null timezone, which is the safe pessimistic
 * shape (the editor can fix during the post-migration pass).
 */

export type JobLocationType = 'city' | 'region' | 'country';

export interface ResolvedJobLocation {
  /** Canonical display name. Same as input unless we re-cased. */
  readonly name: string;
  /** ISO 3166-1 alpha-2. Null when unknown. */
  readonly isoCountry: string | null;
  /** IANA timezone string. Null when unknown. */
  readonly timezone: string | null;
  readonly type: JobLocationType;
}

interface CuratedRow {
  readonly aliases: readonly string[];
  readonly name: string;
  readonly isoCountry: string;
  readonly timezone: string;
  readonly type: JobLocationType;
}

const CURATED: readonly CuratedRow[] = [
  {
    aliases: ['bengaluru', 'bangalore', 'blr', 'bengaluru, india', 'bangalore, india'],
    name: 'Bengaluru',
    isoCountry: 'IN',
    timezone: 'Asia/Kolkata',
    type: 'city',
  },
  {
    aliases: ['mumbai', 'bombay', 'mumbai, india'],
    name: 'Mumbai',
    isoCountry: 'IN',
    timezone: 'Asia/Kolkata',
    type: 'city',
  },
  {
    aliases: ['delhi', 'new delhi', 'delhi, india', 'ncr'],
    name: 'New Delhi',
    isoCountry: 'IN',
    timezone: 'Asia/Kolkata',
    type: 'city',
  },
  {
    aliases: ['india', 'india (remote)', 'remote india', 'in'],
    name: 'India',
    isoCountry: 'IN',
    timezone: 'Asia/Kolkata',
    type: 'country',
  },
  {
    aliases: ['united states', 'usa', 'us', 'united states of america'],
    name: 'United States',
    isoCountry: 'US',
    timezone: 'America/New_York',
    type: 'country',
  },
  {
    aliases: ['united kingdom', 'uk', 'great britain', 'britain'],
    name: 'United Kingdom',
    isoCountry: 'GB',
    timezone: 'Europe/London',
    type: 'country',
  },
  {
    aliases: ['singapore', 'sg'],
    name: 'Singapore',
    isoCountry: 'SG',
    timezone: 'Asia/Singapore',
    type: 'country',
  },
  {
    aliases: ['remote', 'remote (global)', 'worldwide', 'anywhere'],
    name: 'Remote',
    isoCountry: 'US',
    timezone: 'UTC',
    type: 'region',
  },
];

const norm = (raw: string): string => raw.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Look up a Webflow Job Location row by its bare name and return the
 * structured Payload shape. Returns null when no curated row matches —
 * the migration script reports nulls so an editor can fill manually.
 */
export const resolveJobLocation = (
  webflowName: unknown,
): ResolvedJobLocation | null => {
  if (typeof webflowName !== 'string') return null;
  const key = norm(webflowName);
  if (key.length === 0) return null;
  for (const row of CURATED) {
    if (row.aliases.includes(key)) {
      return {
        name: row.name,
        isoCountry: row.isoCountry,
        timezone: row.timezone,
        type: row.type,
      };
    }
  }
  return null;
};
