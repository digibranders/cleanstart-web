/**
 * Seed for the `pageRegistry` collection — one row per apps/web route, so the
 * Schema Manager dashboard lists every page (static pages included) and the web
 * build can compose per-page schema overrides for static + listing routes.
 *
 * Data + guard: src/payload/lib/page-registry-seed.ts (typed, unit-tested).
 *
 * SAFETY: idempotent. A row whose `path` already exists is **skipped** (so a
 * re-run never clobbers an override an editor set in the admin), unless
 * `--force` is passed (which updates title/kind/backingCollection but NEVER
 * touches additionalSchema). `--dry-run` reports the plan without writing.
 *
 * Writing pageRegistry fires no publish/IndexNow/search hooks (the collection
 * has none), so this is safe to run any time.
 *
 * Run (inside the cms container, env mounted):
 *   pnpm exec tsx --env-file=.env scripts/seed-page-registry.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-page-registry.ts
 *   pnpm exec tsx --env-file=.env scripts/seed-page-registry.ts --force
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import {
  PAGE_REGISTRY_SEED,
  assertPageRegistrySeedValid,
} from '../src/payload/lib/page-registry-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  assertPageRegistrySeedValid();

  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of PAGE_REGISTRY_SEED) {
    const existing = await payload.find({
      collection: 'pageRegistry',
      where: { path: { equals: row.path } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const current = existing.docs[0];

    // Seed-managed identity/metadata — safe to refresh on --force.
    const metaData = {
      path: row.path,
      title: row.title,
      kind: row.kind,
      order: row.order,
      ...(row.backingCollection ? { backingCollection: row.backingCollection } : {}),
    };

    if (current) {
      if (!force) {
        skipped += 1;
        continue;
      }
      // --force refreshes seed metadata. It never clobbers an editor's override.
      // webPageType is editor-owned, so it's only FILLED when still unset
      // ('none'/null) — this backfills existing rows (e.g. on prod, where rows
      // predate the field) without overwriting a real choice an editor made.
      const currentWebPageType = (current as { webPageType?: string | null }).webPageType;
      const fillWebPageType =
        row.webPageType != null && (currentWebPageType == null || currentWebPageType === 'none');
      if (!dryRun) {
        await payload.update({
          collection: 'pageRegistry',
          id: current.id,
          data: { ...metaData, ...(fillWebPageType ? { webPageType: row.webPageType } : {}) },
          overrideAccess: true,
        });
      }
      updated += 1;
      continue;
    }

    if (!dryRun) {
      // On first creation seed the initial webPageType too.
      await payload.create({
        collection: 'pageRegistry',
        data: { ...metaData, ...(row.webPageType ? { webPageType: row.webPageType } : {}) },
        overrideAccess: true,
      });
    }
    created += 1;
  }

  const verb = dryRun ? 'PLAN' : 'DONE';
  payload.logger.info(
    `[seed-page-registry] ${verb}: ${created} created, ${updated} updated, ${skipped} skipped (of ${PAGE_REGISTRY_SEED.length}).`,
  );

  process.exit(0);
}

run().catch((err) => {
  console.error('[seed-page-registry] failed:', err);
  process.exit(1);
});
