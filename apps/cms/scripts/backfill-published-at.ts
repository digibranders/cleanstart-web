#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-time backfill for `publishedAt` across the 8 content collections
 * that gained the field after launch. Sets `publishedAt = createdAt`
 * for every doc where `_status === 'published'` and `publishedAt` is
 * currently null — which is every legacy row from before the
 * `firstPublishHook` was wired in.
 *
 * Idempotent: rows that already have `publishedAt` are skipped.
 *
 * Run from the cms app dir with the env file:
 *   node --env-file=.env --no-warnings --experimental-strip-types \
 *     scripts/backfill-published-at.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const COLLECTIONS = [
  'blogs',
  'pages',
  'events',
  'webinars',
  'guides',
  'knowledgeBase',
  'resources',
  'jobs',
] as const;

type CollectionSlug = (typeof COLLECTIONS)[number];

interface CountSummary {
  collection: CollectionSlug;
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  const summaries: CountSummary[] = [];

  for (const collection of COLLECTIONS) {
    const summary: CountSummary = {
      collection,
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    const result = await payload.find({
      collection,
      where: {
        and: [
          { _status: { equals: 'published' } },
          { publishedAt: { exists: false } },
        ],
      },
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    });

    summary.scanned = result.docs.length;

    for (const doc of result.docs) {
      const typed = doc as Record<string, unknown>;
      const id = typed.id;
      const createdAt = typed.createdAt;

      if (typeof createdAt !== 'string' || createdAt.length === 0) {
        summary.skipped += 1;
        continue;
      }

      try {
        await payload.update({
          collection,
          id: id as string | number,
          data: { publishedAt: createdAt } as Record<string, unknown>,
          overrideAccess: true,
        });
        summary.updated += 1;
      } catch (err) {
        summary.errors += 1;
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console -- script output
        console.error(`  ! ${collection}#${String(id)}: ${message}`);
      }
    }

    summaries.push(summary);
    // eslint-disable-next-line no-console -- script output
    console.log(
      `  ${collection.padEnd(15)} scanned=${summary.scanned} updated=${summary.updated} skipped=${summary.skipped} errors=${summary.errors}`,
    );
  }

  const totalUpdated = summaries.reduce((acc, s) => acc + s.updated, 0);
  const totalErrors = summaries.reduce((acc, s) => acc + s.errors, 0);
  // eslint-disable-next-line no-console -- script output
  console.log(`\nDone. Updated ${totalUpdated} rows. Errors: ${totalErrors}.`);

  process.exit(totalErrors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
