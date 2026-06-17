#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: copy each guide's legacy `keywords[]` (array of { keyword })
 * into the consolidated `seo.keywords` (string[] json), then leave the
 * legacy field in place (hidden) for a later cleanup migration.
 *
 * Idempotent: a guide whose `seo.keywords` already contains the legacy
 * set is skipped. Re-runnable. `--dry-run` previews without writing.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-seo-keywords-from-guides.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-seo-keywords-from-guides.ts
 *
 * PROD note: `payload.update` re-fires the guides afterChange hooks.
 * Teams / IndexNow are publish-transition-gated (a re-save of an
 * already-published guide does NOT fire them); the live effects are a
 * Meilisearch re-sync (desired — keywords become searchable) and a
 * version row per updated guide. Run in a quiet window.
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { normalizeKeywords } from '../src/payload/lib/seo/keywords.ts';

const dryRun = process.argv.includes('--dry-run');

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const res = await payload.find({
    collection: 'guides',
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    draft: true,
  });

  let updated = 0;
  let skipped = 0;

  for (const doc of res.docs) {
    const { id, slug } = doc as { id: number; slug?: string | null };

    const legacyRaw = (doc as { keywords?: { keyword?: string | null }[] | null }).keywords;
    const legacy = Array.isArray(legacyRaw)
      ? legacyRaw.map((k) => k?.keyword ?? '').filter((s) => s.length > 0)
      : [];

    if (legacy.length === 0) {
      skipped += 1;
      continue;
    }

    const existing = (doc as { seo?: { keywords?: unknown } }).seo?.keywords;
    const current = normalizeKeywords(existing);
    const merged = normalizeKeywords([...current, ...legacy]);

    if (sameSet(current, merged)) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      payload.logger.info(`[dry-run] guide#${id} ${slug ?? ''}: ${current.length} → ${merged.length} keywords`);
      updated += 1;
      continue;
    }

    await payload.update({
      collection: 'guides',
      id,
      data: { seo: { keywords: merged } } as { seo: { keywords: string[] } },
      depth: 0,
      overrideAccess: true,
    });
    updated += 1;
    payload.logger.info(`✓ guide#${id} ${slug ?? ''}: ${current.length} → ${merged.length} keywords`);
  }

  payload.logger.info(
    `Backfill ${dryRun ? '(dry-run) ' : ''}done: ${updated} ${dryRun ? 'would update' : 'updated'}, ${skipped} skipped.`,
  );
  process.exit(0);
};

try {
  await run();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
