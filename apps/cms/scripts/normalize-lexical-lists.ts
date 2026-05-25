#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill: merge adjacent same-shape `list` nodes inside every Lexical body
 * field stored in Postgres. Fixes content imported from Markdown/Webflow
 * where each bullet was persisted as its own one-item `list` node
 * (producing one `<ul>` per bullet in the rendered DOM).
 *
 * Idempotent: rows that are already clean are skipped. Re-running is a no-op.
 *
 * Flags:
 *   --dry-run        Report what would change without writing.
 *   --bypass-hooks   Write via the DB adapter directly. Skips beforeChange /
 *                    afterChange — no webhook/indexnow/search-sync side
 *                    effects, no `updatedAt` churn beyond the field write,
 *                    no version row, no audit log entries. **Required for
 *                    production runs** so the script doesn't spam Teams,
 *                    falsely ping Bing/Yandex, or pollute editor history.
 *
 * Run from apps/cms with the env file loaded:
 *   # Local dev / staging (full hooks fire — harmless, low volume):
 *   node --env-file=.env --no-warnings --experimental-strip-types \
 *     scripts/normalize-lexical-lists.ts
 *
 *   # Production (quiet, no side effects):
 *   node --env-file=.env --no-warnings --experimental-strip-types \
 *     scripts/normalize-lexical-lists.ts --bypass-hooks
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { needsListMerge, normalizeLexicalValue } from '../src/payload/lib/lexical-normalize';

type Target = {
  collection: string;
  field: string;
};

const TARGETS: readonly Target[] = [
  { collection: 'blogs', field: 'body' },
  { collection: 'news', field: 'body' },
  { collection: 'resources', field: 'body' },
  { collection: 'events', field: 'body' },
  { collection: 'webinars', field: 'body' },
  { collection: 'guides', field: 'body' },
  { collection: 'knowledgeBase', field: 'body' },
  { collection: 'jobs', field: 'body' },
  { collection: 'authors', field: 'bioLong' },
];

type Summary = {
  collection: string;
  field: string;
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
};

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const BYPASS_HOOKS = args.has('--bypass-hooks');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  const summaries: Summary[] = [];

  log(
    `\nMode: ${DRY_RUN ? 'DRY RUN (no writes)' : BYPASS_HOOKS ? 'WRITE via db adapter (hooks bypassed)' : 'WRITE via payload.update (hooks fire)'}\n`,
  );

  for (const target of TARGETS) {
    const summary: Summary = {
      collection: target.collection,
      field: target.field,
      scanned: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    const result = await payload.find({
      collection: target.collection as never,
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      draft: true,
    });

    summary.scanned = result.docs.length;

    for (const doc of result.docs as Record<string, unknown>[]) {
      const id = doc.id;
      const value = doc[target.field];

      if (!needsListMerge(value)) {
        summary.skipped += 1;
        continue;
      }

      if (DRY_RUN) {
        summary.updated += 1;
        continue;
      }

      const normalized = normalizeLexicalValue(value);

      try {
        if (BYPASS_HOOKS) {
          // Direct DB write — skips beforeChange/afterChange entirely.
          // No webhook fires, no IndexNow ping, no search reindex, no
          // audit log entry, no new version row. The field write still
          // touches `updatedAt` at the row level, which is acceptable.
          await payload.db.updateOne({
            collection: target.collection as never,
            where: { id: { equals: id } },
            data: { [target.field]: normalized } as Record<string, unknown>,
          });
        } else {
          await payload.update({
            collection: target.collection as never,
            id: id as string | number,
            data: { [target.field]: normalized } as Record<string, unknown>,
            overrideAccess: true,
          });
        }
        summary.updated += 1;
      } catch (err) {
        summary.errors += 1;
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console -- script output
        console.error(`  ! ${target.collection}.${target.field}#${String(id)}: ${message}`);
      }
    }

    summaries.push(summary);
    log(
      `  ${(`${target.collection}.${target.field}`).padEnd(28)} scanned=${summary.scanned} ${DRY_RUN ? 'would-update' : 'updated'}=${summary.updated} skipped=${summary.skipped} errors=${summary.errors}`,
    );
  }

  const totalUpdated = summaries.reduce((acc, s) => acc + s.updated, 0);
  const totalErrors = summaries.reduce((acc, s) => acc + s.errors, 0);
  log(`\nDone. ${DRY_RUN ? 'Would update' : 'Updated'} ${totalUpdated} rows. Errors: ${totalErrors}.`);

  process.exit(totalErrors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
