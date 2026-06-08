#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill PLACEHOLDER `news.region` values.
 *
 * The News collection's `region` select powers the region filter on the
 * /news listing page, but existing news has no location/region data to
 * derive from. Until real regions are supplied, this assigns a placeholder
 * region round-robin across the enum (deterministic by publication date)
 * so the filter is demonstrably functional across all four regions.
 *
 * ⚠ PLACEHOLDER DATA — these regions are NOT accurate. Replace per-item in
 * the CMS admin when the real regions are known. This script only fills
 * rows whose `region` is still null, so it never clobbers a value an editor
 * (or a later real backfill) has set.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-news-region.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-news-region.ts
 *
 * PROD note: `payload.update` re-fires the news afterChange hooks. The
 * publish-transition-gated hooks (Teams/IndexNow) do NOT fire on a re-save
 * of an already-published item; the only effects are a Meilisearch re-sync
 * and a version row per updated item. Run in a quiet window.
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

type Region = 'asia-pacific' | 'europe-middle-east' | 'usa-north-america';

const REGIONS: readonly Region[] = ['asia-pacific', 'europe-middle-east', 'usa-north-america'];

const dryRun = process.argv.includes('--dry-run');

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const res = await payload.find({
    collection: 'news',
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    sort: '-publicationDate',
  });

  let updated = 0;
  let skipped = 0;

  let index = 0;
  for (const doc of res.docs) {
    const { id, region } = doc as { id: number; region?: Region | null };
    const position = index;
    index += 1;
    if (region) {
      skipped += 1;
      continue;
    }
    // Round-robin placeholder, deterministic by date-sorted position.
    const placeholder = REGIONS[position % REGIONS.length] as Region;

    if (dryRun) {
      payload.logger.info(`[dry-run] news#${id} → ${placeholder} (placeholder)`);
      updated += 1;
      continue;
    }

    await payload.update({
      collection: 'news',
      id,
      data: { region: placeholder },
      overrideAccess: true,
    });
    updated += 1;
    payload.logger.info(`✓ news#${id} → ${placeholder} (placeholder)`);
  }

  payload.logger.info(
    `Backfill ${dryRun ? '(dry-run) ' : ''}done: ${updated} ${dryRun ? 'would fill' : 'filled'} (placeholder), ${skipped} already-set.`,
  );
  process.exit(0);
};

try {
  await run();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
