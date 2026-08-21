#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-off correction for blog posts created via Payload's "Duplicate"
 * action before the `beforeDuplicate` hooks on `publishedAt` /
 * `displayPublishedAt` existed (see apps/cms/src/payload/fields/
 * published-at.ts and display-published-at.ts). Duplicate copied both
 * date fields verbatim from the source doc, and firstPublishHook /
 * displayPublishedAtBackfillHook's "already set" guards then never
 * re-stamped them on the duplicate's actual publish — so the copy
 * sorted (and, until corrected by hand, displayed) under the source
 * post's original publish date.
 *
 * Identified via a millisecond-precision `published_at` collision in
 * the `blogs` table — two independently authored posts cannot share
 * the same millisecond timestamp by chance, so any such collision is
 * a duplicate signature (as opposed to the many legitimate
 * midnight-UTC collisions from the Webflow import, which share only a
 * calendar date):
 *
 *   id=82 "Official Python Docker Image vs CleanStart Python Image"
 *   id=75 "Official Go Docker Image vs CleanStart Hardened Go Image"
 *   both published_at = 2026-08-06 14:10:49.406+00
 *
 * id=82 is the duplicate (created_at 2026-08-19, well after id=75's
 * 2026-08-06). Its `displayPublishedAt` was already hand-corrected by
 * the editor to 2026-08-20 14:10:49.406 — this script brings the
 * locked `publishedAt` field into line with that already-public date
 * so the listing's `sort=-displayPublishedAt` and the byline agree.
 *
 * Not a general backfill — this is intentionally hardcoded to the one
 * confirmed case (verified by hand against a `GROUP BY published_at
 * HAVING count(*) > 1` scan of prod). Re-run the scan before reusing
 * this pattern for a different collection/incident.
 *
 * Usage (dry run first):
 *   DRY_RUN=1 pnpm exec tsx scripts/fix-duplicated-blog-publish-dates.ts
 *   pnpm exec tsx scripts/fix-duplicated-blog-publish-dates.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const TARGET_ID = 82;
const CORRECTED_DATE = '2026-08-20T14:10:49.406Z';
const DRY_RUN = process.env.DRY_RUN === '1';

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const before = await payload.findByID({
    collection: 'blogs',
    id: TARGET_ID,
    depth: 0,
    overrideAccess: true,
  });

  // eslint-disable-next-line no-console -- script output
  console.log(
    `Before: id=${TARGET_ID} title="${before.title}" publishedAt=${before.publishedAt} displayPublishedAt=${before.displayPublishedAt}`,
  );

  if (before.publishedAt === CORRECTED_DATE) {
    // eslint-disable-next-line no-console -- script output
    console.log('Already corrected. Nothing to do.');
    process.exit(0);
  }

  if (DRY_RUN) {
    // eslint-disable-next-line no-console -- script output
    console.log(`[dry run] would set publishedAt=${CORRECTED_DATE} (displayPublishedAt unchanged)`);
    process.exit(0);
  }

  await payload.update({
    collection: 'blogs',
    id: TARGET_ID,
    data: { publishedAt: CORRECTED_DATE },
    overrideAccess: true,
  });

  const after = await payload.findByID({
    collection: 'blogs',
    id: TARGET_ID,
    depth: 0,
    overrideAccess: true,
  });

  // eslint-disable-next-line no-console -- script output
  console.log(
    `After:  id=${TARGET_ID} title="${after.title}" publishedAt=${after.publishedAt} displayPublishedAt=${after.displayPublishedAt}`,
  );

  process.exit(0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
