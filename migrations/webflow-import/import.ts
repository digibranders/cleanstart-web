/**
 * H6 — Import transformed data into Payload via Local API
 *
 * Loads transformed JSONL files into Payload in dependency order:
 *   1. media (from asset checkpoint)
 *   2. authors, categories, newsCategories, jobLocations
 *   3. blogs, news, guides, resources, events, webinars, jobs, aboutGalleries
 *   4. pages
 *   5. redirects (old Webflow slugs → new slugs)
 *
 * Idempotent: looks up by `slug` before inserting — updates if exists.
 * Import log: migrations/webflow-export/.import-log.jsonl
 *
 * Usage:
 *   DATABASE_URI=... PAYLOAD_SECRET=... tsx migrations/webflow-import/import.ts
 *   tsx migrations/webflow-import/import.ts --collection blogs
 *   tsx migrations/webflow-import/import.ts --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

import { getPayload } from 'payload';
import config from '../../apps/cms/src/payload.config';

const TRANSFORMED_DIR = path.resolve('migrations/webflow-export/transformed');
const ASSET_PROGRESS = path.resolve('migrations/webflow-export/.asset-progress.json');
const IMPORT_LOG = path.resolve('migrations/webflow-export/.import-log.jsonl');

const dryRun = process.argv.includes('--dry-run');
const onlyCollection = (() => {
  const idx = process.argv.indexOf('--collection');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

type AssetRecord = { webflowUrl: string; r2Key: string; r2PublicUrl: string; sha256: string };
type ImportLogEntry = { collection: string; webflowId: string; payloadId: number; action: 'created' | 'updated'; timestamp: string };

const appendLog = (entry: ImportLogEntry): void => {
  fs.appendFileSync(IMPORT_LOG, JSON.stringify(entry) + '\n');
};

/** Load transformed JSONL as an array of parsed rows. */
const loadTransformed = async (slug: string): Promise<Record<string, unknown>[]> => {
  const file = path.join(TRANSFORMED_DIR, `${slug}.jsonl`);
  if (!fs.existsSync(file)) return [];
  const rows: Record<string, unknown>[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line) as Record<string, unknown>); } catch { /* skip */ }
  }
  return rows;
};

/** Upsert a single row by slug. Returns the Payload document id. */
const upsert = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: string,
  slug: string | null,
  data: Record<string, unknown>,
  webflowId: string,
): Promise<void> => {
  if (dryRun) {
    console.log(`  [import] DRY RUN: ${collection}/${slug ?? webflowId}`);
    return;
  }

  const where = slug
    ? { slug: { equals: slug } }
    : { _webflowId: { equals: webflowId } };

  const existing = await payload.find({
    collection: collection as Parameters<typeof payload.find>[0]['collection'],
    where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  if (existing.docs.length > 0 && existing.docs[0]) {
    const id = (existing.docs[0] as { id: number }).id;
    await payload.update({
      collection: collection as Parameters<typeof payload.update>[0]['collection'],
      id,
      data: data as Parameters<typeof payload.update>[0]['data'],
      overrideAccess: true,
    });
    appendLog({ collection, webflowId, payloadId: id, action: 'updated', timestamp: new Date().toISOString() });
    console.log(`  [import] updated ${collection}/${slug ?? webflowId} (id=${id})`);
  } else {
    const doc = await payload.create({
      collection: collection as Parameters<typeof payload.create>[0]['collection'],
      data: data as Parameters<typeof payload.create>[0]['data'],
      overrideAccess: true,
    });
    const id = (doc as { id: number }).id;
    appendLog({ collection, webflowId, payloadId: id, action: 'created', timestamp: new Date().toISOString() });
    console.log(`  [import] created ${collection}/${slug ?? webflowId} (id=${id})`);
  }
};

const importCollection = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  collectionSlug: string,
): Promise<void> => {
  if (onlyCollection && onlyCollection !== collectionSlug) return;
  const rows = await loadTransformed(collectionSlug);
  console.log(`[import] ${collectionSlug}: ${rows.length} rows`);
  for (const row of rows) {
    const slug = typeof row.slug === 'string' ? row.slug : null;
    const webflowId = typeof row._webflowId === 'string' ? row._webflowId : `unknown-${Math.random()}`;
    // Strip migration-only underscore keys before inserting.
    const data = Object.fromEntries(
      Object.entries(row).filter(([k]) => !k.startsWith('_')),
    );
    await upsert(payload, collectionSlug, slug, data, webflowId);
  }
};

const importMedia = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<void> => {
  if (onlyCollection && onlyCollection !== 'media') return;
  if (!fs.existsSync(ASSET_PROGRESS)) {
    console.log('[import] No asset progress file — skipping media import');
    return;
  }
  const records = JSON.parse(fs.readFileSync(ASSET_PROGRESS, 'utf-8')) as AssetRecord[];
  console.log(`[import] media: ${records.length} assets`);
  for (const record of records) {
    const filename = path.basename(record.r2Key);
    await upsert(
      payload,
      'media',
      null,
      { filename, url: record.r2PublicUrl, _webflowUrl: record.webflowUrl },
      record.webflowUrl,
    );
  }
};

const run = async (): Promise<void> => {
  console.log(`[import] ${dryRun ? 'DRY RUN — ' : ''}Starting import`);

  const payload = await getPayload({ config });

  await importMedia(payload);

  // Taxonomy first (no cross-collection dependencies).
  for (const slug of ['authors', 'categories', 'newsCategories', 'jobLocations']) {
    await importCollection(payload, slug);
  }

  // Content collections.
  for (const slug of ['blogs', 'news', 'guides', 'resources', 'knowledgeBase', 'events', 'webinars', 'jobs', 'aboutGalleries']) {
    await importCollection(payload, slug);
  }

  // Pages last (may reference other collections).
  await importCollection(payload, 'pages');

  console.log('[import] Done.');
  process.exit(0);
};

run().catch((err) => {
  console.error('[import] Fatal:', err);
  process.exit(1);
});
