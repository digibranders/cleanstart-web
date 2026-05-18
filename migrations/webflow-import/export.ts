/**
 * H1 — Webflow CMS export
 *
 * Pulls all items from every mapped Webflow collection via the v2 API
 * and writes one `.jsonl` file per collection to `migrations/webflow-export/raw/`.
 *
 * Usage:
 *   WEBFLOW_API_TOKEN=... tsx migrations/webflow-import/export.ts
 *   WEBFLOW_API_TOKEN=... tsx migrations/webflow-import/export.ts --dry-run
 *
 * Env vars:
 *   WEBFLOW_API_TOKEN  — Webflow API token (required)
 *   WEBFLOW_SITE_ID    — Webflow site ID (required)
 *
 * Output: migrations/webflow-export/raw/<collection>.jsonl
 * Checkpoint: migrations/webflow-export/.progress.json (resume on re-run)
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── Config ──────────────────────────────────────────────────────

const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';
const OUTPUT_DIR = path.resolve('migrations/webflow-export/raw');
const PROGRESS_FILE = path.resolve('migrations/webflow-export/.progress.json');

/**
 * Webflow slug → local slug (used in output filenames).
 *
 * Webflow's collection slugs are singular kebab-case (verified against the
 * live API on 2026-05-18). Anything not in this map falls back to the raw
 * Webflow slug, which would break the downstream transformers — so add a
 * row here when a new Webflow collection appears.
 */
const COLLECTION_MAP: Record<string, string> = {
  blogs: 'blogs',
  news: 'news',
  guide: 'guides',
  resources: 'resources',
  event: 'events',
  webinar: 'webinars',
  job: 'jobs',
  author: 'authors',
  category: 'categories',
  'news-categories': 'newsCategories',
  'job-location': 'jobLocations',
  'about-gallery': 'aboutGalleries',
};

// Token bucket: 50 req/min = 1 per 1.2s
const REQUEST_INTERVAL_MS = 1200;
const BURST_SIZE = 10;

// ─── Helpers ─────────────────────────────────────────────────────

const apiToken = process.env.WEBFLOW_API_TOKEN;
const siteId = process.env.WEBFLOW_SITE_ID;
const dryRun = process.argv.includes('--dry-run');

if (!apiToken || !siteId) {
  console.error('Missing WEBFLOW_API_TOKEN or WEBFLOW_SITE_ID env vars');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiToken}`,
  'accept-version': '2.0.0',
  'content-type': 'application/json',
};

let lastRequestAt = 0;
let burstUsed = 0;

const throttle = async (): Promise<void> => {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (burstUsed < BURST_SIZE && elapsed < REQUEST_INTERVAL_MS) {
    burstUsed += 1;
    lastRequestAt = now;
    return;
  }
  burstUsed = 0;
  const wait = Math.max(0, REQUEST_INTERVAL_MS - elapsed);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
};

type WebflowItem = {
  id: string;
  cmsLocaleId?: string;
  lastPublished?: string;
  lastUpdated?: string;
  createdOn?: string;
  isArchived?: boolean;
  isDraft?: boolean;
  fieldData?: Record<string, unknown>;
  [key: string]: unknown;
};
type WebflowCollection = { id: string; slug: string; displayName: string };

const get = async <T>(url: string): Promise<T> => {
  await throttle();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
};

const loadProgress = (): Record<string, number> => {
  try {
    const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
};

const saveProgress = (progress: Record<string, number>): void => {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
};

// ─── Main ─────────────────────────────────────────────────────────

const run = async (): Promise<void> => {
  console.log(`[export] ${dryRun ? 'DRY RUN — ' : ''}Fetching Webflow collections for site ${siteId}`);

  if (!dryRun) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const progress = loadProgress();

  // List all collections.
  const collectionsResp = await get<{ collections: WebflowCollection[] }>(
    `${WEBFLOW_API_BASE}/sites/${siteId}/collections`,
  );

  const collections = collectionsResp.collections;
  console.log(`[export] Found ${collections.length} collections`);

  for (const collection of collections) {
    const localSlug = COLLECTION_MAP[collection.slug] ?? collection.slug;
    const alreadyFetched = progress[collection.slug] ?? 0;
    const outFile = path.join(OUTPUT_DIR, `${localSlug}.jsonl`);

    console.log(`[export] ${collection.displayName} (${collection.slug}) → ${localSlug}.jsonl`);

    if (dryRun) continue;

    let offset = alreadyFetched;
    let totalItems = 0;
    const writeStream = fs.createWriteStream(outFile, { flags: offset > 0 ? 'a' : 'w' });

    for (;;) {
      const resp = await get<{ items: WebflowItem[]; pagination: { total: number; offset: number; limit: number } }>(
        `${WEBFLOW_API_BASE}/collections/${collection.id}/items?limit=100&offset=${offset}`,
      );

      const { items, pagination } = resp;
      for (const item of items) {
        const { id, fieldData, ...meta } = item;
        const flatFields = fieldData ?? {};
        const itemSlug = typeof flatFields.slug === 'string' ? flatFields.slug : '';
        writeStream.write(
          JSON.stringify({
            collection: localSlug,
            webflowId: id,
            slug: itemSlug,
            ...flatFields,
            _meta: meta,
          }) + '\n',
        );
      }

      offset += items.length;
      totalItems = pagination.total;
      progress[collection.slug] = offset;
      saveProgress(progress);

      console.log(`  [export]   ${offset}/${totalItems}`);
      if (offset >= totalItems) break;
    }

    writeStream.end();
    console.log(`  [export] ✓ ${totalItems} items written to ${outFile}`);
  }

  console.log('[export] Done.');
};

run().catch((err) => {
  console.error('[export] Fatal:', err);
  process.exit(1);
});
