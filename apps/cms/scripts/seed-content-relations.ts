#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seed the curated next / previous / related relationship fields on the
 * content collections from a pre-computed recommendation file.
 *
 *   blogs  → relatedPosts[], previousPost, nextPost
 *   guides → relatedGuides[], previousGuide, nextGuide
 *   news   → relatedNews[]            (news has no prev/next field)
 *
 * Source of recommendations: scripts/data/content-relations-seed.json
 * (topical learning-path ordering + top-3 related). The file is keyed by
 * SLUG, not id, so it is environment-portable: ids are resolved against
 * whatever database this connects to. A slug that does not exist in the
 * target DB (e.g. a doc not yet imported to prod) is skipped, and any
 * related/prev/next pointing at a missing slug is dropped.
 *
 * Run from apps/cms with the env file loaded (local):
 *   pnpm exec tsx --env-file=.env scripts/seed-content-relations.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-content-relations.ts
 *
 * On the prod droplet the env is already in the container; run without
 * --env-file (see CLAUDE.md "Prod backfill script run mechanism").
 *
 * Idempotent: a doc is updated only when its stored relations differ from
 * the resolved seed. Re-runnable.
 *
 * NOTE: `payload.update` re-fires each collection's afterChange hooks
 * (search sync + a version row per updated doc). The Teams/IndexNow hooks
 * are publish-transition-gated and do NOT fire on a re-save of an already
 * published doc. Run in a quiet window on a shared DB.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

type Collection = 'blogs' | 'guides' | 'news';

interface SeedRow {
  slug: string;
  order: number;
  related: string[];
  previous: string | null;
  next: string | null;
}

type SeedFile = Record<Collection, SeedRow[]>;

/** camelCase field names per collection. News has no prev/next. */
const FIELD_MAP: Record<
  Collection,
  { related: string; previous?: string; next?: string }
> = {
  blogs: { related: 'relatedPosts', previous: 'previousPost', next: 'nextPost' },
  guides: { related: 'relatedGuides', previous: 'previousGuide', next: 'nextGuide' },
  news: { related: 'relatedNews' },
};

const arraysEqual = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** Normalize a Payload relationship value (id | doc | array) to id list. */
const toIds = (value: unknown): number[] => {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .map((v) => (typeof v === 'object' && v !== null ? (v as { id: number }).id : (v as number)))
    .filter((v): v is number => typeof v === 'number');
};

const toId = (value: unknown): number | null => {
  const ids = toIds(value);
  return ids.length > 0 ? ids[0] : null;
};

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const seed = JSON.parse(
    readFileSync(join(HERE, 'data', 'content-relations-seed.json'), 'utf8'),
  ) as SeedFile;

  const payload = await getPayload({ config: payloadConfig });

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalMissing = 0;
  let totalDropped = 0;

  for (const collection of Object.keys(FIELD_MAP) as Collection[]) {
    const fields = FIELD_MAP[collection];
    const rows = seed[collection];

    // Build a slug → id map of every PUBLISHED doc in the target DB.
    // Published-only is deliberate: we never link to unpublished content,
    // and we must not touch draft docs (a draft:false update would
    // accidentally publish them).
    const all = await payload.find({
      collection,
      depth: 0,
      limit: 0,
      pagination: false,
      where: { _status: { equals: 'published' } },
      overrideAccess: true,
    });
    const slugToId = new Map<string, number>();
    for (const doc of all.docs as Array<{ id: number; slug?: string }>) {
      if (doc.slug) slugToId.set(doc.slug, doc.id);
    }

    let updated = 0;
    let skipped = 0;
    let missing = 0;
    let dropped = 0;

    for (const row of rows) {
      const id = slugToId.get(row.slug);
      if (id === undefined) {
        missing += 1;
        continue;
      }

      const desiredRelated: number[] = [];
      for (const s of row.related) {
        const rid = slugToId.get(s);
        if (rid === undefined) {
          dropped += 1;
          continue;
        }
        if (rid !== id) desiredRelated.push(rid);
      }
      const desiredPrev = row.previous ? (slugToId.get(row.previous) ?? null) : null;
      const desiredNext = row.next ? (slugToId.get(row.next) ?? null) : null;

      const current = (await payload.findByID({
        collection,
        id,
        depth: 0,
        overrideAccess: true,
      })) as Record<string, unknown>;

      const data: Record<string, unknown> = {};
      if (!arraysEqual(toIds(current[fields.related]), desiredRelated)) {
        data[fields.related] = desiredRelated;
      }
      if (fields.previous && toId(current[fields.previous]) !== desiredPrev) {
        data[fields.previous] = desiredPrev;
      }
      if (fields.next && toId(current[fields.next]) !== desiredNext) {
        data[fields.next] = desiredNext;
      }

      if (Object.keys(data).length === 0) {
        skipped += 1;
        continue;
      }

      if (dryRun) {
        console.log(`  [${collection}] would update ${row.slug}:`, data);
      } else {
        await payload.update({
          collection,
          id,
          data,
          depth: 0,
          draft: false,
          overrideAccess: true,
        });
      }
      updated += 1;
    }

    console.log(
      `[${collection}] ${dryRun ? 'would update' : 'updated'} ${updated}, skipped ${skipped} (already current), missing-doc ${missing}, dropped-refs ${dropped}`,
    );
    totalUpdated += updated;
    totalSkipped += skipped;
    totalMissing += missing;
    totalDropped += dropped;
  }

  console.log(
    `\nDone${dryRun ? ' (dry-run)' : ''}: ${totalUpdated} ${dryRun ? 'to update' : 'updated'}, ${totalSkipped} skipped, ${totalMissing} missing docs, ${totalDropped} dropped refs.`,
  );

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
