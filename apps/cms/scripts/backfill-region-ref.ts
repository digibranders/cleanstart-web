#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `regionRef` (relationship → regions) from the legacy `region`
 * select enum on BOTH News and Webinars (they share the regions taxonomy).
 * Run AFTER seed-regions.ts, which seeds the union of both enums.
 *
 * For each doc: look up the region doc whose `slug` equals the doc's `region`
 * enum value, and set `regionRef`. Legacy enums left untouched (parallel
 * transition).
 *
 * SAFETY: idempotent. Skips a doc whose `regionRef` is already correct or
 * whose `region` is empty. An unmapped value is logged (re-run seed first).
 * `--dry-run` previews.
 *
 *   pnpm exec tsx --env-file=.env scripts/backfill-region-ref.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-region-ref.ts
 *
 * PROD note: `payload.update` re-fires each collection's afterChange hooks
 * (Teams/IndexNow are publish-transition-gated; Meilisearch re-syncs + a
 * version row per updated doc + a web revalidate). Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

const SOURCES = ['news', 'webinars'] as const;

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  const regions = await payload.find({
    collection: 'regions',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const idBySlug = new Map<string, string | number>();
  for (const r of regions.docs as { id: string | number; slug?: string | null }[]) {
    if (r.slug) idBySlug.set(r.slug, r.id);
  }

  let updated = 0;
  let already = 0;
  let unmapped = 0;
  let noValue = 0;

  for (const collection of SOURCES) {
    const docs = await payload.find({
      collection,
      limit: 1000,
      depth: 0,
      draft: true,
      overrideAccess: true,
    });

    for (const doc of docs.docs as {
      id: string | number;
      region?: string | null;
      regionRef?: string | number | { id: string | number } | null;
    }[]) {
      const value = doc.region;
      if (!value) {
        noValue += 1;
        continue;
      }

      const targetId = idBySlug.get(value);
      if (targetId == null) {
        unmapped += 1;
        console.warn(`UNMAPPED ${collection}/${doc.id} — no region doc for "${value}"`);
        continue;
      }

      const currentRef =
        typeof doc.regionRef === 'object' && doc.regionRef !== null
          ? doc.regionRef.id
          : doc.regionRef;
      if (currentRef === targetId) {
        already += 1;
        continue;
      }

      if (!dryRun) {
        await payload.update({
          collection,
          id: doc.id,
          data: { regionRef: targetId },
          overrideAccess: true,
        });
      }
      updated += 1;
      console.log(`${dryRun ? '[dry-run] ' : ''}set      ${collection}/${doc.id} → ${value}`);
    }
  }

  console.log(
    `\nDone. ${updated} updated · ${already} already-correct · ${noValue} no-region · ${unmapped} unmapped.`,
  );
  process.exit(unmapped > 0 ? 2 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
