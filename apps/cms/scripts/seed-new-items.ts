/**
 * Scoped, create-only seed for post-migration Webflow content.
 *
 * Imports ONLY the rows present in `migrations/webflow-export/transformed-scoped/`
 * (the handful of items that were added in Webflow after the original
 * migration and are missing from prod). It is deliberately surgical:
 *
 *   - Reference collections (authors, categories, newsCategories,
 *     jobLocations) are NEVER written. Their Webflow id -> Payload id
 *     mapping is resolved read-only by matching on `slug` against the
 *     live Payload data, so existing records are left untouched.
 *   - Hero images are created in Media only when an asset with the same
 *     derived filename does not already exist; otherwise the existing
 *     Media doc is reused.
 *   - Content rows are skipped entirely if a doc with the same slug
 *     already exists. Nothing is ever updated.
 *
 * Usage (run from apps/cms so payload + @next/env resolve):
 *   node --env-file=<prod.env> --import tsx/esm scripts/seed-new-items.ts --dry-run
 *   node --env-file=<prod.env> --import tsx/esm scripts/seed-new-items.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { slugify } from '../src/payload/lib/slugify.ts';

// Script lives at apps/cms/scripts/ so `payload` and `@next/env` resolve
// through apps/cms/node_modules; migration data lives at the repo root (../../..).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCOPED_DIR = path.join(REPO_ROOT, 'migrations/webflow-export/transformed-scoped');
const REF_DIR = path.join(REPO_ROOT, 'migrations/webflow-export/transformed');

const dryRun = process.argv.includes('--dry-run');

// Content collections to seed, in dependency-safe order.
const CONTENT_COLLECTIONS = ['blogs', 'news', 'events', 'jobs'] as const;

// Reference collections resolved read-only (Webflow id -> Payload id via slug).
const REF_COLLECTIONS = ['authors', 'categories', 'newsCategories', 'jobLocations'] as const;

// Media folder per content collection (controls the R2 storage prefix).
const MEDIA_FOLDER: Record<string, string> = {
  blogs: 'web/blog',
  news: 'web/news',
  events: 'web/event',
  jobs: 'web/job',
};

// Underscore-prefixed reference marker -> target field + collection + cardinality.
const REF_MAP: Record<string, { field: string; collection: string; hasMany: boolean }> = {
  _rawAuthors: { field: 'authors', collection: 'authors', hasMany: true },
  _rawReviewedBy: { field: 'reviewedBy', collection: 'authors', hasMany: false },
  _rawCategories: { field: 'categories', collection: 'categories', hasMany: false },
  _rawNewsCategories: { field: 'newsCategories', collection: 'newsCategories', hasMany: true },
  _rawSpeakers: { field: 'speakers', collection: 'authors', hasMany: true },
  _rawJobLocation: { field: 'locations', collection: 'jobLocations', hasMany: true },
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

type Payload = Awaited<ReturnType<typeof getPayload>>;
type Row = Record<string, unknown>;

const readJsonl = async (file: string): Promise<Row[]> => {
  if (!fs.existsSync(file)) return [];
  const rows: Row[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line) as Row);
    } catch {
      /* skip malformed */
    }
  }
  return rows;
};

/**
 * Build a `webflowId -> slug` map for a reference collection from the
 * locally transformed data (which carries `_webflowId`).
 */
const buildWebflowSlugMap = async (collection: string): Promise<Map<string, string>> => {
  const rows = await readJsonl(path.join(REF_DIR, `${collection}.jsonl`));
  const map = new Map<string, string>();
  for (const row of rows) {
    const id = typeof row._webflowId === 'string' ? row._webflowId : null;
    const slug = typeof row.slug === 'string' ? row.slug : null;
    if (id && slug) map.set(id, slug);
  }
  return map;
};

/** Read-only `slug -> Payload id` map for a reference collection in prod. */
const buildSlugIdMap = async (
  payload: Payload,
  collection: string,
): Promise<Map<string, number>> => {
  const res = await payload.find({
    collection: collection as Parameters<typeof payload.find>[0]['collection'],
    limit: 1000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const map = new Map<string, number>();
  for (const doc of res.docs as Array<{ id: number; slug?: string }>) {
    if (typeof doc.slug === 'string') map.set(doc.slug, doc.id);
  }
  return map;
};

const heroUrl = (raw: unknown): string | null => {
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  if (raw && typeof raw === 'object' && typeof (raw as { url?: unknown }).url === 'string') {
    return (raw as { url: string }).url.trim();
  }
  return null;
};

/** Derive a clean, SEO-friendly media filename from a Webflow CDN URL. */
const mediaFilename = (url: string): string => {
  const base = decodeURIComponent(path.basename(new URL(url).pathname));
  const ext = path.extname(base).slice(1).toLowerCase();
  // Strip Webflow's leading `<hex>_` object-id prefix.
  const stem = base
    .slice(0, base.length - (ext ? ext.length + 1 : 0))
    .replace(/^[0-9a-f]{16,}_/i, '');
  const cleanStem = slugify(stem) || 'image';
  return ext ? `${cleanStem}.${ext}` : cleanStem;
};

/**
 * Resolve a hero image to a Media id: reuse an existing doc with the same
 * filename, otherwise download from Webflow and create a new Media doc.
 */
const resolveHeroImage = async (
  payload: Payload,
  url: string,
  alt: string,
  folder: string,
): Promise<number | null> => {
  const filename = mediaFilename(url);
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existing.docs.length > 0) {
    const id = (existing.docs[0] as { id: number }).id;
    console.log(`    hero: reuse existing media "${filename}" (id=${id})`);
    return id;
  }

  const ext = path.extname(filename).slice(1).toLowerCase();
  const mimeType = EXT_TO_MIME[ext];
  if (!mimeType) {
    console.warn(`    hero: unsupported extension for ${filename} — skipping image`);
    return null;
  }

  if (dryRun) {
    console.log(`    hero: WOULD create media "${filename}" (folder=${folder}) from ${url}`);
    return null;
  }

  const resp = await fetch(url);
  if (!resp.ok) {
    console.warn(`    hero: fetch failed ${resp.status} for ${url} — skipping image`);
    return null;
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  const doc = await payload.create({
    collection: 'media',
    data: { alt, folder } as Parameters<typeof payload.create>[0]['data'],
    file: { data: buf, mimetype: mimeType, name: filename, size: buf.length },
    overrideAccess: true,
  });
  const id = (doc as { id: number }).id;
  console.log(`    hero: created media "${filename}" (id=${id})`);
  return id;
};

const main = async (): Promise<void> => {
  console.log(`[seed] ${dryRun ? 'DRY RUN — ' : ''}create-only seed of new Webflow content`);
  const payload = await getPayload({ config });

  // Read-only reference resolution: webflowId -> slug -> Payload id.
  const refIdMap: Record<string, Map<string, number>> = {};
  for (const col of REF_COLLECTIONS) {
    const wfSlug = await buildWebflowSlugMap(col);
    const slugId = await buildSlugIdMap(payload, col);
    const m = new Map<string, number>();
    for (const [wfId, slug] of wfSlug) {
      const id = slugId.get(slug);
      if (id != null) m.set(wfId, id);
    }
    refIdMap[col] = m;
    console.log(`[seed] ref ${col}: ${m.size} webflowId->payloadId resolved`);
  }

  const summary = { created: 0, skipped: 0, failed: 0, mediaCreated: 0 };

  for (const collection of CONTENT_COLLECTIONS) {
    const rows = await readJsonl(path.join(SCOPED_DIR, `${collection}.jsonl`));
    if (rows.length === 0) continue;
    console.log(`\n[seed] ${collection}: ${rows.length} candidate row(s)`);

    for (const row of rows) {
      const rawSlug = typeof row.slug === 'string' ? row.slug : null;
      // Payload's Slug field caps at 120 chars; trim over-long Webflow slugs
      // at a hyphen boundary so the record imports instead of failing
      // validation — matches the behaviour of import.ts.
      const slug =
        rawSlug && rawSlug.length > 120 ? rawSlug.slice(0, 120).replace(/-[^-]*$/, '') : rawSlug;
      const title = typeof row.title === 'string' ? row.title : (slug ?? '(untitled)');
      if (!slug) {
        console.warn(`  • SKIP (no slug): ${title}`);
        summary.skipped += 1;
        continue;
      }

      // Safety: never touch an existing doc.
      const existing = await payload.find({
        collection: collection as Parameters<typeof payload.find>[0]['collection'],
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      if (existing.docs.length > 0) {
        console.log(`  • SKIP (already in prod): ${collection}/${slug}`);
        summary.skipped += 1;
        continue;
      }

      // Copy non-scaffolding fields, dropping nulls/undefined.
      const data: Row = {};
      for (const [key, value] of Object.entries(row)) {
        if (key.startsWith('_') && key !== '_status') continue;
        if (value === null || value === undefined) continue;
        data[key] = value;
      }
      // Apply the capped slug (the raw copy above may exceed 120 chars).
      data.slug = slug;

      // Resolve relationship references.
      for (const [rawKey, spec] of Object.entries(REF_MAP)) {
        if (!(rawKey in row) || row[rawKey] == null) continue;
        const map = refIdMap[spec.collection];
        if (!map) continue;
        const keys = Array.isArray(row[rawKey]) ? (row[rawKey] as unknown[]) : [row[rawKey]];
        const ids: number[] = [];
        for (const k of keys) {
          const wfId = typeof k === 'string' ? k : null;
          const id = wfId ? map.get(wfId) : undefined;
          if (id != null) ids.push(id);
          else if (wfId) console.warn(`    ref ${spec.field}: unresolved webflowId ${wfId}`);
        }
        if (ids.length > 0) data[spec.field] = spec.hasMany ? ids : ids[0];
      }

      // Resolve hero image (string URL or { url }).
      const hero = heroUrl(row._rawHeroImage);
      if (hero) {
        const id = await resolveHeroImage(
          payload,
          hero,
          `${title} — hero image`,
          MEDIA_FOLDER[collection],
        );
        if (id != null) {
          data.heroImage = id;
          if (!dryRun) summary.mediaCreated += 1;
        }
      }

      if (dryRun) {
        console.log(
          `  • WOULD CREATE ${collection}/${slug} [${data._status ?? 'published'}]` +
            ` refs={${Object.keys(data)
              .filter((k) =>
                ['authors', 'reviewedBy', 'newsCategories', 'locations', 'heroImage'].includes(k),
              )
              .map((k) => `${k}:${JSON.stringify(data[k])}`)
              .join(', ')}}`,
        );
        continue;
      }

      try {
        const doc = await payload.create({
          collection: collection as Parameters<typeof payload.create>[0]['collection'],
          data: data as Parameters<typeof payload.create>[0]['data'],
          overrideAccess: true,
        });
        const id = (doc as { id: number }).id;
        console.log(`  • CREATED ${collection}/${slug} (id=${id})`);
        summary.created += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  • FAILED ${collection}/${slug}: ${msg}`);
        summary.failed += 1;
      }
    }
  }

  console.log(
    `\n[seed] Done. created=${summary.created} skipped=${summary.skipped} failed=${summary.failed} mediaCreated=${summary.mediaCreated}`,
  );
  process.exit(summary.failed > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('[seed] Fatal:', err);
  process.exit(1);
});
