/**
 * H5 — Upload assets to R2
 *
 * Scans all transformed JSONL files for Webflow CDN URLs, downloads each
 * unique asset, hashes it, and uploads to R2. Checkpoint-based so re-runs
 * skip already-uploaded assets (SHA-256 keyed).
 *
 * Usage:
 *   tsx migrations/webflow-import/upload-assets.ts
 *
 * Env vars: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
 *           R2_PUBLIC_URL_BASE (e.g. https://assets.cleanstart.com)
 *
 * Output: migrations/webflow-export/.asset-progress.json
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import crypto from 'node:crypto';

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

import { buildMediaFilename } from '../../apps/cms/src/payload/lib/media-filename';
import type { AssetContext, AssetRole } from './build-asset-context-map';

const TRANSFORMED_DIR = path.resolve('migrations/webflow-export/transformed');
const PROGRESS_FILE = path.resolve('migrations/webflow-export/.asset-progress.json');
const CONTEXT_FILE = path.resolve('migrations/webflow-export/.asset-context.json');

/**
 * Webflow currently serves CMS assets from `cdn.prod.website-files.com`.
 * The two legacy uploads-* hosts predate the cdn.prod migration and are
 * still seen in older body HTML, so we match all three.
 */
// Allow `(`, `)`, `'` in URLs — Webflow filenames legitimately include
// these (e.g. `_V2 (1).pdf`). The character class excludes only the
// characters that would terminate a JSON string (`"`) or an HTML
// attribute / tag (`<`, `>`). Trailing punctuation that often follows
// a URL in prose (`.`, `,`, `;`, `]`, `)` when it would be unbalanced)
// is cleaned up by `cleanseUrl()` below.
const WEBFLOW_CDN_RE =
  /https:\/\/(?:cdn\.prod\.website-files\.com|uploads(?:-ssl)?\.webflow\.com)\/[^\s"<>]+/g;

const cleanseUrl = (url: string): string => url.replace(/[.,;]+$/, '');
const CONCURRENCY = 4;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

type AssetRecord = {
  webflowUrl: string;
  r2Key: string;
  r2PublicUrl: string;
  sha256: string;
  /** Resolved Media `folder` value (e.g. 'web/blog'). Used by import.ts to set the doc's folder field so the s3-storage prefix lines up with the actual R2 key. */
  folder?: string;
  /** Pre-computed alt hint (Webflow img alt attribute, or the slug-source label) — saves the import step from re-deriving it. */
  altHint?: string;
};

// Map the asset-context primary collection to the Media folder enum
// from apps/cms/src/payload/collections/Media.ts:14. The enum is
// `web/{type}`; we use `general` as the safe default for collections
// that don't have a dedicated bucket.
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

const folderForCollection = (collection: string): string =>
  COLLECTION_TO_FOLDER[collection] ?? 'web/general';

const loadContextMap = (): Map<string, AssetContext> => {
  const map = new Map<string, AssetContext>();
  if (!fs.existsSync(CONTEXT_FILE)) {
    console.warn(
      `[upload-assets] Context map not found at ${CONTEXT_FILE} — run build-asset-context-map.ts first. Falling back to generic naming.`,
    );
    return map;
  }
  try {
    const entries = JSON.parse(fs.readFileSync(CONTEXT_FILE, 'utf-8')) as AssetContext[];
    for (const e of entries) map.set(e.webflowUrl, e);
  } catch (err) {
    console.warn(
      `[upload-assets] Failed to parse context map (${(err as Error).message}); falling back to generic naming.`,
    );
  }
  return map;
};

const slugSourceForContext = (
  ctx: AssetContext | undefined,
  url: string,
): string => {
  if (ctx) {
    // No collection prefix: the asset already lands in the
    // `web/<collection>/` R2 folder (see `folderForCollection`), so a
    // `blog-`/`news-` stem would only duplicate the path segment.
    return `${ctx.primary.docSlug}-${ctx.primary.role}`;
  }
  // No context — best effort: use the original Webflow filename so at
  // least the basename carries some meaning. `buildMediaFilename` strips
  // Webflow's leading 24-char asset-id prefix from it.
  const basename = path.basename(new URL(url).pathname).replace(/\.[^.]+$/, '');
  return basename || 'webflow-asset';
};

const extForRole = (role: AssetRole, urlExt: string): string => {
  // Migration runs are byte-pass-through — we don't re-encode here, so
  // the on-disk extension should track the source. Strip the leading
  // dot and lowercase for consistency with media-filename's contract.
  return urlExt.replace(/^\.+/, '').toLowerCase() || (role === 'pdf' ? 'pdf' : 'bin');
};

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) { console.error(`Missing env var: ${name}`); process.exit(1); }
  return v;
};

const r2 = new S3Client({
  endpoint: requireEnv('R2_ENDPOINT'),
  credentials: {
    accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
  },
  region: 'auto',
  forcePathStyle: true,
});
const bucket = requireEnv('R2_BUCKET');
// Apps/cms uses `R2_PUBLIC_BASE`; the original docs referenced
// `R2_PUBLIC_URL_BASE`. Accept either — apps/cms is the source of
// truth for env names.
const publicUrlBase = (
  process.env.R2_PUBLIC_BASE ??
  process.env.R2_PUBLIC_URL_BASE ??
  ''
).replace(/\/$/, '');

/**
 * Two maps are needed:
 *   - `progress`     — keyed by webflowUrl. One entry per source URL, even
 *                       if multiple URLs alias to the same R2 object. This
 *                       is the canonical persistence shape so every Webflow
 *                       reference resolves at import time.
 *   - `shaToRecord`  — keyed by sha256. Used to detect content-duplicate
 *                       URLs so we can skip re-uploading.
 */
const loadProgress = (): { progress: Map<string, AssetRecord>; shaToRecord: Map<string, AssetRecord> } => {
  const progress = new Map<string, AssetRecord>();
  const shaToRecord = new Map<string, AssetRecord>();
  try {
    const records = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')) as AssetRecord[];
    for (const r of records) {
      progress.set(r.webflowUrl, r);
      // Keep the FIRST record per sha as the canonical R2 source for
      // future aliasing.
      if (!shaToRecord.has(r.sha256)) shaToRecord.set(r.sha256, r);
    }
  } catch {
    /* start fresh */
  }
  return { progress, shaToRecord };
};

const saveProgress = (map: Map<string, AssetRecord>): void => {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(map.values()), null, 2));
};

const collectUrls = async (): Promise<Set<string>> => {
  const urls = new Set<string>();
  const files = fs.readdirSync(TRANSFORMED_DIR).filter((f) => f.endsWith('.jsonl'));
  for (const file of files) {
    const rl = readline.createInterface({ input: fs.createReadStream(path.join(TRANSFORMED_DIR, file)) });
    for await (const line of rl) {
      for (const match of line.matchAll(WEBFLOW_CDN_RE)) urls.add(cleanseUrl(match[0]));
    }
  }
  return urls;
};

const downloadWithRetry = async (url: string, attempt = 1): Promise<Buffer> => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    return downloadWithRetry(url, attempt + 1);
  }
};

const processUrl = async (
  url: string,
  progress: Map<string, AssetRecord>,
  shaToRecord: Map<string, AssetRecord>,
  contextMap: Map<string, AssetContext>,
): Promise<void> => {
  if (progress.has(url)) {
    console.log(`  [upload-assets] skip (url already mapped): ${url.slice(-60)}`);
    return;
  }
  const buf = await downloadWithRetry(url);
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

  // Content-dedup: if another Webflow URL already produced this exact
  // file, alias the new URL to the same R2 object. This is essential
  // for category icons / re-used hero images where editors picked the
  // same source asset on two different rows — without this aliasing,
  // only the first URL would resolve in the import's ref step.
  const existing = shaToRecord.get(sha256);
  if (existing) {
    const alias: AssetRecord = { ...existing, webflowUrl: url };
    progress.set(url, alias);
    console.log(`  [upload-assets] alias (same content): ${url.slice(-60)}`);
    return;
  }

  const rawExt = path.extname(new URL(url).pathname) || '.bin';
  const ctx = contextMap.get(url);
  const slugSource = slugSourceForContext(ctx, url);
  const role: AssetRole = ctx?.primary.role ?? 'inline';
  const ext = extForRole(role, rawExt);
  const folder = ctx ? folderForCollection(ctx.primary.collection) : 'web/general';

  const filename = buildMediaFilename({
    slugSource,
    bytes: buf,
    ext,
    hashOverride: sha256.slice(0, 8),
  });

  // Honour R2_UPLOAD_PREFIX so dry-run uploads stay sandboxed under
  // `dev/` (or whatever isolation prefix the env defines) rather than
  // landing alongside prod media at the bucket root. The folder
  // segment matches the Media collection's `prefix` derivation so a
  // Media doc created with `folder = ctx.folder` will resolve to the
  // same object via Payload's s3-storage plugin.
  const prefix = (process.env.R2_UPLOAD_PREFIX ?? '').replace(/^\/+|\/+$/g, '');
  const folderSegment = folder.replace(/^web\//, '');
  const r2Key = prefix
    ? `${prefix}/${folderSegment}/${filename}`
    : `${folderSegment}/${filename}`;

  // Skip the actual PUT if the object is already in R2.
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: r2Key }));
    console.log(`  [upload-assets] skip (exists in R2): ${r2Key}`);
  } catch {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: r2Key,
        Body: buf,
        ContentType: `image/${ext === 'bin' ? 'octet-stream' : ext}`,
      }),
    );
    console.log(`  [upload-assets] uploaded: ${r2Key}`);
  }

  const r2PublicUrl = `${publicUrlBase}/${r2Key}`;
  const record: AssetRecord = {
    webflowUrl: url,
    r2Key,
    r2PublicUrl,
    sha256,
    folder,
    altHint: ctx?.primary.altHint,
  };
  progress.set(url, record);
  shaToRecord.set(sha256, record);
};

const runBatch = async (
  urls: string[],
  progress: Map<string, AssetRecord>,
  shaToRecord: Map<string, AssetRecord>,
  contextMap: Map<string, AssetContext>,
): Promise<void> => {
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((url) =>
        processUrl(url, progress, shaToRecord, contextMap).catch((err: unknown) =>
          console.error(`  [upload-assets] ERROR ${url}: ${err instanceof Error ? err.message : err}`),
        ),
      ),
    );
    saveProgress(progress);
    console.log(`[upload-assets] Progress: ${Math.min(i + CONCURRENCY, urls.length)}/${urls.length}`);
  }
};

const run = async (): Promise<void> => {
  console.log('[upload-assets] Scanning transformed files for asset URLs…');

  if (!fs.existsSync(TRANSFORMED_DIR)) {
    console.error('[upload-assets] Transformed dir not found. Run transform/index.ts first.');
    process.exit(1);
  }

  const urls = await collectUrls();
  console.log(`[upload-assets] Found ${urls.size} unique asset URLs`);

  const { progress, shaToRecord } = loadProgress();
  const contextMap = loadContextMap();
  console.log(`[upload-assets] Loaded ${contextMap.size} context entries`);
  const remaining = Array.from(urls).filter((url) => !progress.has(url));
  console.log(
    `[upload-assets] ${remaining.length} to process (${urls.size - remaining.length} already mapped)`,
  );

  await runBatch(remaining, progress, shaToRecord, contextMap);
  console.log(`[upload-assets] Done. ${progress.size} url→record mappings.`);
};

run().catch((err) => {
  console.error('[upload-assets] Fatal:', err);
  process.exit(1);
});
