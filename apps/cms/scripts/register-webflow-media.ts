/**
 * Register every Webflow-migrated asset as a Payload Media doc.
 *
 * Reads `migrations/webflow-export/.asset-progress.json` (produced by
 * `migrations/webflow-import/upload-assets.ts`), downloads each asset
 * back from R2 once, and streams it through Payload's upload pipeline
 * via `payload.create({ collection: 'media', file })`. The pipeline
 * handles mime detection, Sharp resizing, and the s3-storage plugin
 * push to R2 — so the resulting Media docs are first-class (same
 * shape as anything uploaded via the admin UI).
 *
 * Outputs `migrations/webflow-export/.media-progress.json` mapping
 * `webflowUrl → mediaPayloadId`. The follow-up `run-webflow-import.ts`
 * uses this map to resolve `_rawHeroImage` / `_rawPhoto` / `_rawAsset`
 * relationship fields to real Media doc IDs.
 *
 * Idempotent: looks up existing media by filename before creating.
 * Re-running is safe and cheap (no re-upload for existing files).
 *
 * Usage:
 *   node --import tsx/esm scripts/register-webflow-media.ts            # all
 *   node --import tsx/esm scripts/register-webflow-media.ts --limit 5  # quick test
 *
 * Requires the same env as run-webflow-import.ts (DATABASE_URI,
 * PAYLOAD_SECRET, R2_*).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';
import config from '../src/payload.config.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const ASSET_PROGRESS = path.join(REPO_ROOT, 'migrations/webflow-export/.asset-progress.json');
const ASSET_CONTEXT = path.join(REPO_ROOT, 'migrations/webflow-export/.asset-context.json');
const MEDIA_PROGRESS = path.join(REPO_ROOT, 'migrations/webflow-export/.media-progress.json');

interface AssetRecord {
  webflowUrl: string;
  r2Key: string;
  r2PublicUrl: string;
  sha256: string;
  folder?: string;
}

interface AssetContextPrimary {
  collection: string;
  docSlug: string;
  role: string;
  altHint?: string;
}

interface AssetContext {
  webflowUrl: string;
  primary: AssetContextPrimary;
  otherRefs: number;
}

interface MediaMapEntry {
  webflowUrl: string;
  mediaId: number;
  filename: string;
}

// Mirror of upload-assets.ts so the Media.ts beforeValidate hook
// produces the SAME canonical filename → both pipelines end up at
// the same R2 base key (modulo the raster→webp extension swap).
const COLLECTION_TO_FOLDER: Record<string, string> = {
  authors: 'web/author',
  blogs: 'web/blog',
  news: 'web/news',
  guides: 'web/guide',
  resources: 'web/resource',
  events: 'web/event',
  webinars: 'web/webinar',
  jobs: 'web/job',
  aboutGalleries: 'web/about',
  pages: 'web/page',
};

const COLLECTION_SHORT: Record<string, string> = {
  authors: 'author',
  blogs: 'blog',
  news: 'news',
  guides: 'guide',
  resources: 'resource',
  events: 'event',
  webinars: 'webinar',
  jobs: 'job',
  aboutGalleries: 'about',
  pages: 'page',
};

const folderForCollection = (collection: string): string =>
  COLLECTION_TO_FOLDER[collection] ?? 'web/general';

const shortCollection = (collection: string): string =>
  COLLECTION_SHORT[collection] ?? 'general';

const slugSourceForContext = (ctx: AssetContext | undefined, fallback: string): string => {
  if (ctx) {
    const altHint = ctx.primary.altHint?.trim();
    if (altHint) return altHint;
    return `${shortCollection(ctx.primary.collection)}-${ctx.primary.docSlug}-${ctx.primary.role}`;
  }
  return fallback;
};

const loadContextMap = (): Map<string, AssetContext> => {
  const map = new Map<string, AssetContext>();
  if (!fs.existsSync(ASSET_CONTEXT)) {
    console.warn(
      `[register-media] No .asset-context.json — falling back to generic naming. Run build-asset-context-map.ts first for semantic filenames.`,
    );
    return map;
  }
  try {
    const entries = JSON.parse(fs.readFileSync(ASSET_CONTEXT, 'utf-8')) as AssetContext[];
    for (const e of entries) map.set(e.webflowUrl, e);
  } catch {
    /* ignore */
  }
  return map;
};

const limitArg = (() => {
  const idx = process.argv.indexOf('--limit');
  return idx >= 0 ? Number.parseInt(process.argv[idx + 1] ?? '0', 10) : 0;
})();

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
};

/**
 * Derive a clean, deduped filename from a Webflow CDN URL.
 *
 * Webflow encodes the original filename in the path after a `_`
 * separator: `<r2hash>_<originalName>.<ext>`. We keep the original
 * name (URL-decoded, spaces collapsed to dashes) and prefix the
 * sha256 hash so duplicates by content don't collide on filename.
 */
const deriveFilename = (webflowUrl: string, sha256: string): string => {
  const urlPath = new URL(webflowUrl).pathname;
  const base = path.basename(urlPath);
  // Decode, collapse whitespace to dashes, and strip any character
  // that isn't alphanumeric / dash / dot / underscore. Editors used
  // semicolons (`;`) and parens in their Webflow filenames, both of
  // which trip Payload's PDF validator (and would land on R2 with
  // ugly URL-encoded paths anyway).
  const decoded = decodeURIComponent(base)
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '-');
  // Strip the Webflow hash prefix (32-char hex + underscore).
  const stripped = decoded.replace(/^[a-f0-9]{32}_/i, '');
  // Prefix our own sha256 (first 12 chars) so two distinct sources
  // with the same human filename don't collide.
  const ext = path.extname(stripped) || '.bin';
  const name = path.basename(stripped, ext).slice(0, 80);
  return `${sha256.slice(0, 12)}-${name}${ext}`;
};

const loadAssetProgress = (): AssetRecord[] => {
  if (!fs.existsSync(ASSET_PROGRESS)) {
    console.error(`[register-media] Asset progress not found at ${ASSET_PROGRESS}.`);
    console.error('Run migrations/webflow-import/upload-assets.ts first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(ASSET_PROGRESS, 'utf-8')) as AssetRecord[];
};

const loadMediaProgress = (): Map<string, MediaMapEntry> => {
  const map = new Map<string, MediaMapEntry>();
  if (!fs.existsSync(MEDIA_PROGRESS)) return map;
  try {
    const entries = JSON.parse(fs.readFileSync(MEDIA_PROGRESS, 'utf-8')) as MediaMapEntry[];
    for (const e of entries) map.set(e.webflowUrl, e);
  } catch {
    /* start fresh */
  }
  return map;
};

const saveMediaProgress = (map: Map<string, MediaMapEntry>): void => {
  fs.writeFileSync(MEDIA_PROGRESS, JSON.stringify(Array.from(map.values()), null, 2));
};

const downloadBuffer = async (url: string): Promise<Buffer> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

const run = async (): Promise<void> => {
  const assets = loadAssetProgress();
  const progress = loadMediaProgress();
  const contextMap = loadContextMap();
  console.log(
    `[register-media] ${assets.length} assets · ${progress.size} already registered · ${contextMap.size} context entries`,
  );

  const payload = await getPayload({ config });
  const todo = assets.filter((a) => !progress.has(a.webflowUrl));
  const slice = limitArg > 0 ? todo.slice(0, limitArg) : todo;
  console.log(`[register-media] ${slice.length} to process`);

  // Build a sha → mediaId map from already-mapped entries so two
  // Webflow URLs that alias to the same R2 object (same SHA-256)
  // share the same Payload Media doc instead of creating a duplicate.
  const shaToMediaId = new Map<string, number>();
  for (const entry of progress.values()) {
    const matchingAsset = assets.find((a) => a.webflowUrl === entry.webflowUrl);
    if (matchingAsset) shaToMediaId.set(matchingAsset.sha256, entry.mediaId);
  }

  let done = 0;
  for (const asset of slice) {
    done += 1;
    // `filename` here is only used as a stable lookup key for prior
    // registrations + the upload pipeline's `file.name` (which the
    // Media.ts `beforeValidate` hook then rewrites). The on-disk
    // filename in Payload is what the hook computes from `alt`.
    const filename = deriveFilename(asset.webflowUrl, asset.sha256);
    const ext = path.extname(filename).toLowerCase();
    const mimetype = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    const ctx = contextMap.get(asset.webflowUrl);
    // The Media.ts hook uses `data.alt` as the slug source when it's
    // a non-empty string; here we use the asset-context's semantic
    // `{shortCollection}-{docSlug}-{role}` form so the resulting R2
    // filename carries SEO meaning (e.g. `blog-openclaw-...-hero`).
    const slugSource = slugSourceForContext(ctx, path.basename(filename, ext));
    const folder = ctx ? folderForCollection(ctx.primary.collection) : 'web/general';

    // 1) Same content already registered? Alias to that media doc.
    const existingMediaId = shaToMediaId.get(asset.sha256);
    if (existingMediaId != null) {
      progress.set(asset.webflowUrl, {
        webflowUrl: asset.webflowUrl,
        mediaId: existingMediaId,
        filename,
      });
      console.log(`  [${done}/${slice.length}] alias  ${filename} → media #${existingMediaId}`);
      if (done % 20 === 0) saveMediaProgress(progress);
      continue;
    }

    // 2) Same filename already in Payload? Reuse it.
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      const id = (existing.docs[0] as { id: number }).id;
      progress.set(asset.webflowUrl, { webflowUrl: asset.webflowUrl, mediaId: id, filename });
      shaToMediaId.set(asset.sha256, id);
      console.log(`  [${done}/${slice.length}] reuse  ${filename} → media #${id}`);
      if (done % 20 === 0) saveMediaProgress(progress);
      continue;
    }

    let buf: Buffer;
    try {
      buf = await downloadBuffer(asset.r2PublicUrl);
    } catch (err) {
      console.error(`  [${done}/${slice.length}] FETCH FAIL ${filename}: ${err}`);
      continue;
    }

    try {
      // Payload's `file` shape: data, mimetype, name, size.
      // Cast through `unknown` because the public type narrows
      // `file` to a structure that depends on the collection upload
      // shape, and our migration is intentionally minimal.
      const doc = await payload.create({
        collection: 'media',
        data: {
          alt: slugSource,
          folder,
        } as Parameters<typeof payload.create>[0]['data'],
        file: {
          data: buf,
          mimetype,
          name: filename,
          size: buf.length,
        } as unknown as Parameters<typeof payload.create>[0]['file'],
        overrideAccess: true,
      });
      const id = (doc as { id: number }).id;
      progress.set(asset.webflowUrl, { webflowUrl: asset.webflowUrl, mediaId: id, filename });
      shaToMediaId.set(asset.sha256, id);
      console.log(`  [${done}/${slice.length}] created ${filename} → media #${id}`);
    } catch (err) {
      const note = err instanceof Error ? err.message : String(err);
      console.error(`  [${done}/${slice.length}] FAIL    ${filename}: ${note.slice(0, 120)}`);
    }

    if (done % 20 === 0) saveMediaProgress(progress);
  }

  saveMediaProgress(progress);
  console.log(`[register-media] Done. ${progress.size}/${assets.length} mapped.`);
  process.exit(0);
};

run().catch((err) => {
  console.error('[register-media] Fatal:', err);
  process.exit(1);
});
