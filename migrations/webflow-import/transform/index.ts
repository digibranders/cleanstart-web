/**
 * H3 — Transform orchestrator
 *
 * Reads raw JSONL from `migrations/webflow-export/raw/` and writes
 * Payload-shaped JSONL to `migrations/webflow-export/transformed/`.
 *
 * Usage:
 *   tsx migrations/webflow-import/transform/index.ts
 *   tsx migrations/webflow-import/transform/index.ts --collection blogs
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

import { transformAboutGallery } from './about-galleries';
import { transformAuthor } from './authors';
import { transformBlog } from './blogs';
import { transformCategory } from './categories';
import { transformEvent } from './events';
import { transformGuide } from './guides';
import { transformJob } from './jobs';
import { transformJobLocation } from './job-locations';
import { transformNews } from './news';
import { transformNewsCategory } from './news-categories';
import { transformPage } from './pages';
import { transformResource } from './resources';
import { transformWebinar } from './webinars';

const RAW_DIR = path.resolve('migrations/webflow-export/raw');
const OUT_DIR = path.resolve('migrations/webflow-export/transformed');

type Transformer = (row: Record<string, unknown>) => Record<string, unknown>;

/**
 * Ordered so taxonomies and authors are transformed before the content
 * collections that reference them. The import step relies on the same
 * ordering — keep it in sync with `import.ts:IMPORT_ORDER`.
 */
const TRANSFORMERS: Record<string, Transformer> = {
  authors: transformAuthor,
  categories: transformCategory,
  newsCategories: transformNewsCategory,
  jobLocations: transformJobLocation,
  aboutGalleries: transformAboutGallery,
  blogs: transformBlog,
  news: transformNews,
  guides: transformGuide,
  events: transformEvent,
  webinars: transformWebinar,
  jobs: transformJob,
  resources: transformResource,
  pages: transformPage,
};

const collectionArg = (() => {
  const idx = process.argv.indexOf('--collection');
  return idx >= 0 ? process.argv[idx + 1] : null;
})();

const transformCollection = async (slug: string, transformer: Transformer): Promise<void> => {
  const inFile = path.join(RAW_DIR, `${slug}.jsonl`);
  const outFile = path.join(OUT_DIR, `${slug}.jsonl`);

  if (!fs.existsSync(inFile)) {
    console.warn(`[transform] ${slug}: raw file not found, skipping`);
    return;
  }

  const rl = readline.createInterface({ input: fs.createReadStream(inFile) });
  const writeStream = fs.createWriteStream(outFile);

  let total = 0;
  let errors = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line) as Record<string, unknown>;
      const transformed = transformer(raw) as Record<string, unknown>;
      // Pass Webflow's authoring history (`_meta.createdOn` /
      // `_meta.lastUpdated` / `_meta.lastPublished`) through to the
      // import step. Individual transformers only emit the fields
      // they care about, but the import needs `_meta` to restore
      // Payload's `created_at` / `updated_at` timestamps after
      // Payload's auto-stamp.
      const meta = raw._meta as Record<string, unknown> | undefined;
      if (meta && transformed._meta === undefined) transformed._meta = meta;
      // For collections that don't have an explicit editorial
      // publish date in Webflow (guides, jobs, authors), fall back
      // to `_meta.lastPublished` so `publishedAt` reflects when the
      // row last went live in Webflow rather than being null.
      if (
        transformed.publishedAt == null &&
        transformed.publicationDate == null &&
        meta &&
        typeof meta.lastPublished === 'string'
      ) {
        transformed.publishedAt = meta.lastPublished;
      }
      writeStream.write(JSON.stringify(transformed) + '\n');
      total += 1;
    } catch (err) {
      errors += 1;
      console.error(`[transform] ${slug}: error transforming row:`, err);
    }
  }

  writeStream.end();
  console.log(`[transform] ${slug}: ${total} rows transformed${errors > 0 ? `, ${errors} errors` : ''} → ${outFile}`);
};

const run = async (): Promise<void> => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const slugs = collectionArg
    ? [collectionArg]
    : Object.keys(TRANSFORMERS);

  for (const slug of slugs) {
    const transformer = TRANSFORMERS[slug];
    if (!transformer) {
      console.warn(`[transform] No transformer for "${slug}"`);
      continue;
    }
    await transformCollection(slug, transformer);
  }

  console.log('[transform] Done.');
};

run().catch((err) => {
  console.error('[transform] Fatal:', err);
  process.exit(1);
});
