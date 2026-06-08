#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `events.country` from each event's free-text `venue`.
 *
 * Events were imported from Webflow with only a free-text `venue`
 * (e.g. "The Lalit, Mumbai", "Zingari, San Francisco, United States").
 * The new `country` select field powers the country filter on the
 * /events listing page, but existing rows have it null. This maps each
 * venue to a country enum value via a substring table, matched by id.
 *
 * Idempotent: only writes when the mapped country differs from what's
 * stored. Re-runnable. Venues that match no rule are logged (never
 * guessed) so a new country can be added to COUNTRY_RULES + the Events
 * collection enum.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-event-country.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-event-country.ts
 *
 * PROD note: `payload.update` re-fires the events afterChange hooks
 * (search sync, IndexNow, Teams webhook, version row per event). The
 * publish-transition-gated hooks (Teams/IndexNow) do NOT fire on a
 * re-save of an already-published event, but Meilisearch re-syncs and a
 * version row is created per updated event. Run in a quiet window.
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

type Country = 'india' | 'united-states' | 'uae' | 'thailand';

/**
 * Ordered venue-substring → country rules. First match wins, so more
 * specific country names sit alongside their cities; the generic
 * country token is enough for the rest. All matching is case-insensitive.
 */
const COUNTRY_RULES: ReadonlyArray<{ country: Country; patterns: string[] }> = [
  { country: 'uae', patterns: ['uae', 'united arab emirates', 'dubai', 'abu dhabi'] },
  { country: 'thailand', patterns: ['thailand', 'phuket', 'bangkok'] },
  {
    country: 'united-states',
    patterns: ['united states', 'usa', 'u.s.a', 'north america', 'san francisco'],
  },
  {
    country: 'india',
    // Country token, plus the cities present in the current data that ship
    // a venue without "India" (e.g. "The Lalit, Mumbai") and other common
    // Indian metros so future ad-hoc venues still resolve.
    patterns: [
      'india',
      'mumbai',
      'goa',
      'bengaluru',
      'bangalore',
      'new delhi',
      'delhi',
      'chennai',
      'lucknow',
      'coimbatore',
      'hyderabad',
      'pune',
      'kolkata',
      'gurugram',
      'gurgaon',
      'noida',
      'ahmedabad',
      'jaipur',
    ],
  },
];

const mapVenueToCountry = (venue: string): Country | null => {
  const haystack = venue.toLowerCase();
  for (const { country, patterns } of COUNTRY_RULES) {
    if (patterns.some((p) => haystack.includes(p))) return country;
  }
  return null;
};

const dryRun = process.argv.includes('--dry-run');

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const res = await payload.find({
    collection: 'events',
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });

  let updated = 0;
  let unchanged = 0;
  let unmapped = 0;

  for (const event of res.docs) {
    const { id, venue, country: current } = event as {
      id: number;
      venue?: string | null;
      country?: Country | null;
    };

    if (!venue || venue.trim().length === 0) {
      unmapped += 1;
      payload.logger.warn(`⚠ event#${id}: empty venue, cannot map country`);
      continue;
    }

    const country = mapVenueToCountry(venue);
    if (!country) {
      unmapped += 1;
      payload.logger.warn(`⚠ event#${id}: unmapped venue "${venue}" — add a COUNTRY_RULES entry`);
      continue;
    }

    if ((current ?? null) === country) {
      unchanged += 1;
      continue;
    }

    if (dryRun) {
      payload.logger.info(`[dry-run] event#${id} "${venue}" → ${country}`);
      updated += 1;
      continue;
    }

    await payload.update({
      collection: 'events',
      id,
      data: { country },
      overrideAccess: true,
    });
    updated += 1;
    payload.logger.info(`✓ event#${id} "${venue}" → ${country}`);
  }

  payload.logger.info(
    `Backfill ${dryRun ? '(dry-run) ' : ''}done: ${updated} ${dryRun ? 'would update' : 'updated'}, ${unchanged} already-set, ${unmapped} unmapped.`,
  );
  process.exit(0);
};

try {
  await run();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
