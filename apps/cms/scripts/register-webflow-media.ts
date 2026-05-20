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
import {
  buildMediaFilename,
  canonicalExtensionForMime,
} from '../src/payload/lib/media-filename.ts';

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
 * Compute the canonical Media filename matching what Media.ts
 * beforeValidate would produce — `{slug}-{sha8}.{canonicalExt}`.
 *
 * Important: we set this as `file.name` BEFORE calling payload.create
 * so Payload's sharp variant pipeline picks it up as the base stem.
 * If we left `file.name` as the raw Webflow basename, variants would
 * land in R2 with messy `<webflow-id>_original-name-WxH.ext` keys
 * even though the main doc's `filename` got renamed by the hook —
 * a known asymmetry between the hook and the sharp pipeline.
 *
 * Output matches buildMediaFilename's contract: same bytes + same
 * slug source → same filename. The hook re-derives the same result
 * from `data.alt` (which we pass as the slugSource), so file.name +
 * data.alt + the hook output all converge on one canonical name.
 */
const deriveFilename = (
  webflowUrl: string,
  sha256: string,
  slugSource: string,
  mimetype: string,
): string => {
  const fallbackExt = path.extname(new URL(webflowUrl).pathname).replace(/^\.+/, '').toLowerCase();
  // Mirror the Media hook: rasters → webp, svg/pdf pass-through, otherwise
  // fall back to the source ext (PDFs come through as application/pdf).
  const ext = canonicalExtensionForMime(mimetype) || fallbackExt || 'bin';
  return buildMediaFilename({
    slugSource,
    bytes: Buffer.alloc(0), // ignored when hashOverride is set
    ext,
    hashOverride: sha256.slice(0, 8),
  });
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
    // Determine mimetype from the URL extension (Webflow CDN URLs end
    // with the original ext — Webflow never serves webp-converted
    // images for raster sources). Then derive a canonical filename
    // that matches what Media.ts beforeValidate would compute, so
    // sharp variant generation inherits the canonical stem instead
    // of the raw Webflow basename.
    const ctx = contextMap.get(asset.webflowUrl);
    const slugSource = slugSourceForContext(ctx, path.basename(new URL(asset.webflowUrl).pathname));
    const folder = ctx ? folderForCollection(ctx.primary.collection) : 'web/general';
    const urlExt = path.extname(new URL(asset.webflowUrl).pathname).toLowerCase();
    const mimetype = MIME_BY_EXT[urlExt] ?? 'application/octet-stream';
    const filename = deriveFilename(asset.webflowUrl, asset.sha256, slugSource, mimetype);
    const ext = path.extname(filename).toLowerCase();

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
