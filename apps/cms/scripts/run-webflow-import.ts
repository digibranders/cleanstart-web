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

import { Client as PgClient } from 'pg';
import { getPayload } from 'payload';
import config from '../src/payload.config.ts';

// Anchor paths to this file's location. The script lives at
// apps/cms/scripts/ so that `payload` and `@next/env` resolve through
// apps/cms/node_modules; the migration data lives at the repo root.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TRANSFORMED_DIR = path.join(REPO_ROOT, 'migrations/webflow-export/transformed');
const IMPORT_LOG = path.join(REPO_ROOT, 'migrations/webflow-export/.import-log.jsonl');

const dryRun = process.argv.includes('--dry-run');
const onlyCollection = (() => {
  const idx = process.argv.indexOf('--collection');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

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
  // Webflow MultiReference fields (e.g. Blogs.categories) ship as
  // arrays even when Payload only stores a single ref — take the
  // first element so we don't drop the relation entirely.
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const id = resolveOne(item, collection);
      if (id != null) return id;
    }
    return null;
  }
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

/** Hard cap from the Payload slugField validator (apps/cms/.../fields/slug.ts). */
const SLUG_LIMIT = 120;

const clampSlug = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  // Collapse runs of `-` and strip leading/trailing dashes — Webflow
  // emits patterns like `systems-engineer---research` for em-dashes in
  // titles, which Payload's slug validator rejects.
  let cleaned = value.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (cleaned.length > SLUG_LIMIT) {
    const cut = cleaned.slice(0, SLUG_LIMIT);
    const lastDash = cut.lastIndexOf('-');
    cleaned = lastDash > SLUG_LIMIT - 30 ? cut.slice(0, lastDash) : cut;
  }
  return cleaned;
};

/**
 * Events.gallery is a per-row array of `{image, caption?}` objects,
 * not a plain many-ref. The transform emits `_rawGallery` as an array
 * of Webflow image refs ({url, alt}) — we resolve each to a Payload
 * media id and emit the wrapped Payload shape.
 */
const resolveGallery = (
  raw: unknown,
): Array<{ image: number; caption?: string }> => {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ image: number; caption?: string }> = [];
  for (const item of raw) {
    const id = resolveOne(item, 'media');
    if (id != null) out.push({ image: id });
  }
  return out;
};

/**
 * Pull Webflow's `_meta.createdOn` / `_meta.lastUpdated` into Payload's
 * `createdAt` / `updatedAt`. Payload's create/update API respects
 * explicit values for these so we preserve the authoring history
 * instead of stamping every row with the migration's run time.
 *
 * `lastPublished` from Webflow is intentionally NOT overwritten on
 * `publishedAt` here — that value is the editorial publication date
 * driven by per-collection fields (`date-of-publication`,
 * `publication-date`, `event-date`, `publish-date`, `webinar-date`)
 * which the transforms already set.
 */
const applyWebflowDates = (
  row: Record<string, unknown>,
  out: Record<string, unknown>,
): void => {
  const meta = row._meta;
  if (!meta || typeof meta !== 'object') return;
  const m = meta as Record<string, unknown>;
  if (typeof m.createdOn === 'string') out.createdAt = m.createdOn;
  if (typeof m.lastUpdated === 'string') out.updatedAt = m.lastUpdated;
};

/**
 * Underscore-prefixed keys are normally migration scaffolding (e.g.
 * `_webflowId`, `_rawHeroImage`, `_meta`) — stripped before insert.
 * The two exceptions are Payload's own draft/publish discriminator
 * (`_status`) and its first-publish timestamp on the News collection
 * (`_status` paired with `publishedAt` / `publicationDate`). Keep
 * these so the import actually promotes rows to published.
 */
const PAYLOAD_RESERVED_KEYS = new Set(['_status']);

const resolveRefs = (row: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith('_') && !PAYLOAD_RESERVED_KEYS.has(key)) continue;
    out[key] = key === 'slug' ? clampSlug(value) : value;
  }
  applyWebflowDates(row, out);
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
  // Special case: events.gallery — array of {image, caption?} objects.
  if (Array.isArray(row._rawGallery)) {
    const gallery = resolveGallery(row._rawGallery);
    if (gallery.length > 0) out.gallery = gallery;
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

  // Media collection doesn't carry a `slug` — it dedups by `filename`
  // (which is unique per upload doc). Everything else dedups by slug.
  const lookupField = collection === 'media' ? 'filename' : 'slug';
  const existing = slug
    ? await payload.find({
        collection: collection as Parameters<typeof payload.find>[0]['collection'],
        where: { [lookupField]: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
    : { docs: [] };

  // For drafts-enabled collections, setting `_status: 'published'`
  // alone isn't enough — Payload's create/update flow needs
  // `draft: false` to actually promote the new version to live. The
  // migration uniformly publishes every row it imports; editors can
  // unpublish later if needed.
  const shouldPublish = data._status === 'published';

  if (existing.docs.length > 0 && existing.docs[0]) {
    const id = (existing.docs[0] as { id: number }).id;
    try {
      await payload.update({
        collection: collection as Parameters<typeof payload.update>[0]['collection'],
        id,
        data: data as Parameters<typeof payload.update>[0]['data'],
        draft: shouldPublish ? false : undefined,
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
      draft: shouldPublish ? false : undefined,
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

/**
 * Camel-case collection slug → snake-case Postgres table name. Payload
 * uses camelCase identifiers in the API but generates snake_case tables.
 */
const COLLECTION_TO_TABLE: Record<string, string> = {
  newsCategories: 'news_categories',
  jobLocations: 'job_locations',
  aboutGalleries: 'about_galleries',
};

const tableFor = (slug: string): string => COLLECTION_TO_TABLE[slug] ?? slug;

/**
 * Payload's create/update path auto-stamps `created_at` / `updated_at`
 * to the current time, ignoring explicit values for `updatedAt`. To
 * preserve the authoring history from Webflow we run a raw SQL UPDATE
 * through a dedicated pg client after every successful upsert.
 *
 * The pg client is created lazily on first call (so dry runs and
 * --collection runs that hit no rows don't open a second connection).
 */

let pgClient: PgClient | null = null;
const getPgClient = async (): Promise<PgClient> => {
  if (pgClient) return pgClient;
  const uri = process.env.DATABASE_URI;
  if (!uri) throw new Error('DATABASE_URI not set');
  pgClient = new PgClient({ connectionString: uri });
  await pgClient.connect();
  return pgClient;
};

const closePgClient = async (): Promise<void> => {
  if (pgClient) {
    await pgClient.end();
    pgClient = null;
  }
};

const setWebflowTimestamps = async (
  collectionSlug: string,
  id: number,
  createdOn: unknown,
  lastUpdated: unknown,
): Promise<void> => {
  const created = typeof createdOn === 'string' ? createdOn : null;
  const updated = typeof lastUpdated === 'string' ? lastUpdated : null;
  if (!created && !updated) return;
  const table = tableFor(collectionSlug);
  const sets: string[] = [];
  const args: string[] = [];
  if (created) {
    args.push(created);
    sets.push(`created_at = $${args.length}`);
  }
  if (updated) {
    args.push(updated);
    sets.push(`updated_at = $${args.length}`);
  }
  args.push(String(id));
  try {
    const client = await getPgClient();
    await client.query(
      `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${args.length}`,
      args,
    );
  } catch (err) {
    console.warn(
      `  [import] timestamp restore failed for ${collectionSlug}/${id}: ${err instanceof Error ? err.message : err}`,
    );
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
    const rawSlug = typeof row.slug === 'string' ? row.slug : null;
    // Clamp/normalise the slug for both lookup and write so the
    // raw-slug → clean-slug transition is idempotent.
    const slug = rawSlug ? (clampSlug(rawSlug) as string) : null;
    const webflowId =
      typeof row._webflowId === 'string' ? row._webflowId : `unknown-${Math.random()}`;
    const resolved = resolveRefs(row);
    const id = await upsert(payload, collectionSlug, slug, resolved, webflowId);
    if (id != null) recordMapping(collectionSlug, webflowId, id);
    if (id != null && row._meta && typeof row._meta === 'object') {
      const meta = row._meta as Record<string, unknown>;
      await setWebflowTimestamps(collectionSlug, id, meta.createdOn, meta.lastUpdated);
    }
  }
};

const MEDIA_PROGRESS = path.join(REPO_ROOT, 'migrations/webflow-export/.media-progress.json');
const ASSET_PROGRESS = path.join(REPO_ROOT, 'migrations/webflow-export/.asset-progress.json');

interface MediaMapEntry {
  webflowUrl: string;
  mediaId: number;
  filename: string;
}

interface AssetCheckpointEntry {
  webflowUrl: string;
  r2PublicUrl: string;
  sha256: string;
}

const importMedia = async (
  _payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<void> => {
  if (onlyCollection && onlyCollection !== 'media') return;

  // Media docs themselves are registered by the separate
  // `register-webflow-media.ts` helper (which can re-run safely and
  // shows per-asset progress). Here we just load the resulting
  // webflowUrl → mediaId map into the in-memory ref table so the
  // content import step can resolve `_rawHeroImage` / `_rawPhoto` /
  // `_rawAsset` references to real Payload Media doc IDs.
  //
  // H4 (rewrite-body-urls) rewrites every Webflow CDN URL in the
  // transformed JSONL to its R2 equivalent, including the ones
  // inside `_rawHeroImage.url` etc. To resolve the relationship,
  // we also key the media map by R2 URL — joined via the asset
  // checkpoint (Webflow URL → R2 URL).
  if (!fs.existsSync(MEDIA_PROGRESS)) {
    console.log(
      '[import] No media-progress.json — content heroImage / photo / asset refs will be empty. Run scripts/register-webflow-media.ts first to populate.',
    );
    return;
  }
  const entries = JSON.parse(fs.readFileSync(MEDIA_PROGRESS, 'utf-8')) as MediaMapEntry[];
  for (const e of entries) recordMapping('media', e.webflowUrl, e.mediaId);

  if (fs.existsSync(ASSET_PROGRESS)) {
    const assets = JSON.parse(fs.readFileSync(ASSET_PROGRESS, 'utf-8')) as AssetCheckpointEntry[];
    const wfToR2 = new Map<string, string>();
    for (const a of assets) wfToR2.set(a.webflowUrl, a.r2PublicUrl);
    let r2Keys = 0;
    for (const e of entries) {
      const r2 = wfToR2.get(e.webflowUrl);
      if (r2) {
        recordMapping('media', r2, e.mediaId);
        r2Keys += 1;
      }
    }
    console.log(
      `[import] media map: ${entries.length} webflow URLs + ${r2Keys} R2 aliases → Payload media IDs`,
    );
  } else {
    console.log(`[import] media map: ${entries.length} webflow URLs → Payload media IDs`);
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

  // Content collections.
  for (const slug of [
    'blogs',
    'news',
    'guides',
    'resources',
    'events',
    'webinars',
    'jobs',
  ]) {
    await importCollection(payload, slug);
  }

  // AboutGalleries is import-blocked at v1 because the Payload schema
  // makes `image` required and we haven't registered the R2 assets as
  // Media docs yet (see the importMedia comment above). The 20 rows
  // are small and visual — editors will recreate them by drag-and-
  // dropping the existing R2 URLs into the AboutGalleries collection.
  // Their R2 assets are already uploaded (H5) and the original
  // Webflow URLs are preserved in the transformed JSONL for cross-
  // reference.
  console.log(
    '[import] aboutGalleries: 20 rows held back (need Media docs first). See transformed/aboutGalleries.jsonl.',
  );

  // Pages last (may reference other collections).
  await importCollection(payload, 'pages');

  await closePgClient();
  console.log('[import] Done.');
  process.exit(0);
};

run().catch((err) => {
  console.error('[import] Fatal:', err);
  process.exit(1);
});
