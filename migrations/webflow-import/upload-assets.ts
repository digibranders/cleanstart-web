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

const TRANSFORMED_DIR = path.resolve('migrations/webflow-export/transformed');
const PROGRESS_FILE = path.resolve('migrations/webflow-export/.asset-progress.json');

const WEBFLOW_CDN_RE = /https:\/\/uploads(?:-ssl)?\.webflow\.com\/[^\s"')>]+/g;
const CONCURRENCY = 4;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

type AssetRecord = { webflowUrl: string; r2Key: string; r2PublicUrl: string; sha256: string };

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
const publicUrlBase = (process.env.R2_PUBLIC_URL_BASE ?? '').replace(/\/$/, '');

const loadProgress = (): Map<string, AssetRecord> => {
  const map = new Map<string, AssetRecord>();
  try {
    const records = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')) as AssetRecord[];
    for (const r of records) map.set(r.sha256, r);
  } catch { /* start fresh */ }
  return map;
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
      for (const match of line.matchAll(WEBFLOW_CDN_RE)) urls.add(match[0]);
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
): Promise<void> => {
  const buf = await downloadWithRetry(url);
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

  if (progress.has(sha256)) {
    console.log(`  [upload-assets] skip (already uploaded): ${url.slice(-60)}`);
    return;
  }

  const ext = path.extname(new URL(url).pathname) || '.bin';
  const r2Key = `media/webflow-migration/${sha256}${ext}`;

  // Skip if already in R2.
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: r2Key }));
    console.log(`  [upload-assets] skip (exists in R2): ${r2Key}`);
  } catch {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: r2Key,
        Body: buf,
        ContentType: `image/${ext.slice(1) || 'octet-stream'}`,
      }),
    );
    console.log(`  [upload-assets] uploaded: ${r2Key}`);
  }

  const r2PublicUrl = `${publicUrlBase}/${r2Key}`;
  progress.set(sha256, { webflowUrl: url, r2Key, r2PublicUrl, sha256 });
};

const runBatch = async (
  urls: string[],
  progress: Map<string, AssetRecord>,
): Promise<void> => {
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((url) =>
        processUrl(url, progress).catch((err: unknown) =>
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

  const progress = loadProgress();
  const remaining = Array.from(urls).filter((url) => {
    // Check if already in progress by webflowUrl
    return !Array.from(progress.values()).some((r) => r.webflowUrl === url);
  });
  console.log(`[upload-assets] ${remaining.length} to upload (${urls.size - remaining.length} already done)`);

  await runBatch(remaining, progress);
  console.log('[upload-assets] Done.');
};

run().catch((err) => {
  console.error('[upload-assets] Fatal:', err);
  process.exit(1);
});
