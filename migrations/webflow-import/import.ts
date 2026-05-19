/**
 * H6 — Import transformed data into Payload via Local API
 *
 * Loads transformed JSONL files into Payload in dependency order:
 *   1. media (from asset checkpoint)
 *   2. authors, categories, newsCategories, jobLocations
 *   3. blogs, news, guides, resources, events, webinars, jobs, aboutGalleries
 *   4. pages
 *
 * Idempotent: looks up by `slug` before inserting — updates if exists.
 * Maintains an in-memory `webflowId → payloadId` map per collection so
 * the content collections can rewrite their `_rawX` reference markers
 * into real Payload IDs before the row is sent to Payload.
 *
 * Underscore-prefixed keys in the transformed row are migration
 * scaffolding (`_webflowId`, `_rawAuthors`, `_rawHeroImage`, …) and
 * are stripped before insert.
 *
 * Usage:
 *   DATABASE_URI=... PAYLOAD_SECRET=... tsx migrations/webflow-import/import.ts
 *   tsx migrations/webflow-import/import.ts --collection blogs
 *   tsx migrations/webflow-import/import.ts --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';
import config from '../../apps/cms/src/payload.config';
import { humaniseFilename } from '../../apps/cms/src/payload/lib/humanise-filename';

// Anchor paths to this file's location, not the process cwd, so the
// script works whether invoked from the repo root (via tsx) or from
// apps/cms (via node --experimental-strip-types) — both are needed
// because Payload Local API requires running from a package that
// resolves `payload`, but our migration data lives at the repo root.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const TRANSFORMED_DIR = path.join(REPO_ROOT, 'migrations/webflow-export/transformed');
const ASSET_PROGRESS = path.join(REPO_ROOT, 'migrations/webflow-export/.asset-progress.json');
const IMPORT_LOG = path.join(REPO_ROOT, 'migrations/webflow-export/.import-log.jsonl');

const dryRun = process.argv.includes('--dry-run');
const onlyCollection = (() => {
  const idx = process.argv.indexOf('--collection');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

type AssetRecord = {
  webflowUrl: string;
  r2Key: string;
  r2PublicUrl: string;
  sha256: string;
  /** Media `folder` enum value (`web/blog`, `web/author`, …). Optional for backwards compatibility with progress files written before H4.5. */
  folder?: string;
  /** Webflow `alt` attribute extracted from inline body HTML, when available. */
  altHint?: string;
};

type ImportLogEntry = {
  collection: string;
  webflowId: string;
  payloadId: number;
  action: 'created' | 'updated' | 'skipped';
  timestamp: string;
  note?: string;
};

const appendLog = (entry: ImportLogEntry): void => {
  fs.appendFileSync(IMPORT_LOG, JSON.stringify(entry) + '\n');
};

// ─── Webflow ID → Payload ID lookup ────────────────────────────────

/**
 * Per-collection map of `webflowId → payloadId`. Populated as each
 * upsert runs. The Media map is additionally keyed by Webflow CDN
 * URL so transforms can hand off the raw Webflow URL on relationship
 * fields without needing to know the asset-checkpoint shape.
 */
const idMap: Record<string, Map<string, number>> = {
  authors: new Map(),
  categories: new Map(),
  newsCategories: new Map(),
  jobLocations: new Map(),
  aboutGalleries: new Map(),
  media: new Map(),
  blogs: new Map(),
  news: new Map(),
  guides: new Map(),
  events: new Map(),
  webinars: new Map(),
  jobs: new Map(),
  resources: new Map(),
};

const recordMapping = (collection: string, webflowId: string, payloadId: number): void => {
  if (!idMap[collection]) idMap[collection] = new Map();
  idMap[collection].set(webflowId, payloadId);
};

const lookupId = (collection: string, webflowId: string): number | null =>
  idMap[collection]?.get(webflowId) ?? null;

// ─── Reference resolution ──────────────────────────────────────────

/**
 * Mapping of underscore-prefixed source key → { target field name,
 * target collection name, cardinality }. The import step uses this
 * to walk the transformed row, look up Webflow IDs via `idMap`,
 * and write the resolved Payload IDs back to the row before insert.
 */
const REF_MAP: Record<
  string,
  { field: string; collection: string; hasMany: boolean } | undefined
> = {
  _rawAuthors: { field: 'authors', collection: 'authors', hasMany: true },
  _rawReviewedBy: { field: 'reviewedBy', collection: 'authors', hasMany: false },
  _rawCategories: { field: 'categories', collection: 'categories', hasMany: false },
  _rawNewsCategories: { field: 'newsCategories', collection: 'newsCategories', hasMany: true },
  _rawSpeakers: { field: 'speakers', collection: 'authors', hasMany: true },
  _rawJobLocation: { field: 'locations', collection: 'jobLocations', hasMany: true },
  _rawHeroImage: { field: 'heroImage', collection: 'media', hasMany: false },
  _rawIcon: { field: 'icon', collection: 'media', hasMany: false },
  _rawPhoto: { field: 'photo', collection: 'media', hasMany: false },
  _rawImage: { field: 'image', collection: 'media', hasMany: false },
  _rawAsset: { field: 'asset', collection: 'media', hasMany: false },
  _rawPdf: { field: 'pdf', collection: 'media', hasMany: false },
};

interface WebflowRef {
  readonly id?: string;
  readonly url?: string;
}

const refToWebflowKey = (ref: unknown): string | null => {
  if (typeof ref === 'string' && ref.trim().length > 0) return ref.trim();
  if (typeof ref === 'object' && ref !== null) {
    const r = ref as WebflowRef;
    if (typeof r.id === 'string') return r.id;
    if (typeof r.url === 'string') return r.url;
  }
  return null;
};

const resolveOne = (raw: unknown, collection: string): number | null => {
  const key = refToWebflowKey(raw);
  if (!key) return null;
  return lookupId(collection, key);
};

const resolveMany = (raw: unknown, collection: string): number[] => {
  const list = Array.isArray(raw) ? raw : [raw];
  const out: number[] = [];
  for (const item of list) {
    const id = resolveOne(item, collection);
    if (id != null) out.push(id);
  }
  return out;
};

const resolveRefs = (row: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('_')) continue;
    out[key] = value;
  }
  for (const [rawKey, spec] of Object.entries(REF_MAP)) {
    if (!spec) continue;
    if (!(rawKey in row)) continue;
    const raw = row[rawKey];
    if (raw == null) continue;
    if (spec.hasMany) {
      const ids = resolveMany(raw, spec.collection);
      if (ids.length > 0) out[spec.field] = ids;
    } else {
      const id = resolveOne(raw, spec.collection);
      if (id != null) out[spec.field] = id;
    }
  }
  return out;
};

// ─── Per-collection loader / upsert ───────────────────────────────

const loadTransformed = async (slug: string): Promise<Record<string, unknown>[]> => {
  const file = path.join(TRANSFORMED_DIR, `${slug}.jsonl`);
  if (!fs.existsSync(file)) return [];
  const rows: Record<string, unknown>[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line) as Record<string, unknown>);
    } catch {
      /* skip malformed line */
    }
  }
  return rows;
};

const upsert = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: string,
  slug: string | null,
  data: Record<string, unknown>,
  webflowKey: string,
): Promise<number | null> => {
  if (dryRun) {
    console.log(`  [import] DRY RUN: ${collection}/${slug ?? webflowKey}`);
    return null;
  }

  const where = slug ? { slug: { equals: slug } } : { id: { equals: -1 } };
  const existing = slug
    ? await payload.find({
        collection: collection as Parameters<typeof payload.find>[0]['collection'],
        where,
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
    : { docs: [] };

  if (existing.docs.length > 0 && existing.docs[0]) {
    const id = (existing.docs[0] as { id: number }).id;
    try {
      await payload.update({
        collection: collection as Parameters<typeof payload.update>[0]['collection'],
        id,
        data: data as Parameters<typeof payload.update>[0]['data'],
        overrideAccess: true,
      });
      appendLog({
        collection,
        webflowId: webflowKey,
        payloadId: id,
        action: 'updated',
        timestamp: new Date().toISOString(),
      });
      console.log(`  [import] updated ${collection}/${slug ?? webflowKey} (id=${id})`);
      return id;
    } catch (err) {
      const note = err instanceof Error ? err.message : String(err);
      appendLog({
        collection,
        webflowId: webflowKey,
        payloadId: id,
        action: 'skipped',
        timestamp: new Date().toISOString(),
        note,
      });
      console.error(`  [import] FAILED update ${collection}/${slug ?? webflowKey}: ${note}`);
      return id;
    }
  }

  try {
    const doc = await payload.create({
      collection: collection as Parameters<typeof payload.create>[0]['collection'],
      data: data as Parameters<typeof payload.create>[0]['data'],
      overrideAccess: true,
    });
    const id = (doc as { id: number }).id;
    appendLog({
      collection,
      webflowId: webflowKey,
      payloadId: id,
      action: 'created',
      timestamp: new Date().toISOString(),
    });
    console.log(`  [import] created ${collection}/${slug ?? webflowKey} (id=${id})`);
    return id;
  } catch (err) {
    const note = err instanceof Error ? err.message : String(err);
    appendLog({
      collection,
      webflowId: webflowKey,
      payloadId: 0,
      action: 'skipped',
      timestamp: new Date().toISOString(),
      note,
    });
    console.error(`  [import] FAILED create ${collection}/${slug ?? webflowKey}: ${note}`);
    return null;
  }
};

const importCollection = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  collectionSlug: string,
): Promise<void> => {
  if (onlyCollection && onlyCollection !== collectionSlug) return;
  const rows = await loadTransformed(collectionSlug);
  if (rows.length === 0) return;
  console.log(`[import] ${collectionSlug}: ${rows.length} rows`);
  for (const row of rows) {
    const slug = typeof row.slug === 'string' ? row.slug : null;
    const webflowId =
      typeof row._webflowId === 'string' ? row._webflowId : `unknown-${Math.random()}`;
    const resolved = resolveRefs(row);
    const id = await upsert(payload, collectionSlug, slug, resolved, webflowId);
    if (id != null) recordMapping(collectionSlug, webflowId, id);
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
    // Prefer the Webflow alt attribute when the asset-context pre-pass
    // captured one; otherwise humanise the (now slug-shaped) filename
    // so editors land on a sane default instead of the SHA-256 hash
    // alt that the original importer emitted.
    const alt =
      typeof record.altHint === 'string' && record.altHint.trim().length > 0
        ? record.altHint.trim()
        : humaniseFilename(filename);
    const folder = record.folder ?? 'web/general';
    const id = await upsert(
      payload,
      'media',
      filename, // dedup by filename for media so re-runs are idempotent
      { filename, url: record.r2PublicUrl, alt, folder },
      record.webflowUrl,
    );
    if (id != null) recordMapping('media', record.webflowUrl, id);
  }
};

const run = async (): Promise<void> => {
  console.log(`[import] ${dryRun ? 'DRY RUN — ' : ''}Starting import`);

  const payload = await getPayload({ config });

  await importMedia(payload);

  // Taxonomy + people first (no cross-collection dependencies).
  for (const slug of ['authors', 'categories', 'newsCategories', 'jobLocations']) {
    await importCollection(payload, slug);
  }

  // Content collections. AboutGalleries last in this group because it
  // has no FK dependencies but uses media refs heavily.
  for (const slug of [
    'blogs',
    'news',
    'guides',
    'resources',
    'events',
    'webinars',
    'jobs',
    'aboutGalleries',
  ]) {
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
