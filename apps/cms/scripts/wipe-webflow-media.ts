/**
 * Wipe every Payload Media doc that was created by the Webflow
 * migration, plus the R2 objects under the legacy migration prefix
 * and all on-disk checkpoint files. Leaves admin-uploaded media
 * untouched.
 *
 * Identification: every Webflow-migrated Media doc id is recorded in
 * `migrations/webflow-export/.media-progress.json`. We delete strictly
 * by that id list — never by folder or filename pattern.
 *
 * For R2 we list and delete only objects under the previous migration
 * prefix (`{R2_UPLOAD_PREFIX}/media/webflow-migration/*`). New uploads
 * land under the per-collection folders (`dev/blog/...`, `dev/news/...`)
 * driven by the asset-context map; those land OVER admin paths so we
 * never blanket-delete those.
 *
 * Usage:
 *   pnpm --filter @cleanstart/cms exec node --import tsx/esm \
 *     scripts/wipe-webflow-media.ts --dry-run
 *   ... and without --dry-run to actually wipe.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { getPayload } from 'payload';
import config from '../src/payload.config.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const MEDIA_PROGRESS = path.join(REPO_ROOT, 'migrations/webflow-export/.media-progress.json');
const ASSET_PROGRESS = path.join(REPO_ROOT, 'migrations/webflow-export/.asset-progress.json');
const ASSET_CONTEXT = path.join(REPO_ROOT, 'migrations/webflow-export/.asset-context.json');
const IMPORT_LOG = path.join(REPO_ROOT, 'migrations/webflow-export/.import-log.jsonl');
const TRANSFORMED_DIR = path.join(REPO_ROOT, 'migrations/webflow-export/transformed');
const RAW_DIR = path.join(REPO_ROOT, 'migrations/webflow-export/raw');
const PROGRESS_FILE = path.join(REPO_ROOT, 'migrations/webflow-export/.progress.json');

const dryRun = process.argv.includes('--dry-run');
const keepCheckpoints = process.argv.includes('--keep-checkpoints');
const keepRaw = process.argv.includes('--keep-raw');

interface MediaMapEntry {
  webflowUrl: string;
  mediaId: number;
  filename: string;
}

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
};

const wipeMediaDocs = async (): Promise<{ deleted: number; failed: number }> => {
  if (!fs.existsSync(MEDIA_PROGRESS)) {
    console.log('[wipe] No media-progress.json — skipping Payload media wipe.');
    return { deleted: 0, failed: 0 };
  }
  const entries = JSON.parse(fs.readFileSync(MEDIA_PROGRESS, 'utf-8')) as MediaMapEntry[];
  const ids = Array.from(new Set(entries.map((e) => e.mediaId)));
  console.log(`[wipe] ${ids.length} unique Payload Media docs to delete`);

  if (dryRun) return { deleted: 0, failed: 0 };

  const payload = await getPayload({ config });
  let deleted = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await payload.delete({ collection: 'media', id, overrideAccess: true });
      deleted += 1;
    } catch (err) {
      // Doc may already be gone from a prior partial wipe.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('not found')) {
        deleted += 1;
        continue;
      }
      failed += 1;
      console.warn(`  [wipe] media #${id} failed: ${msg.slice(0, 100)}`);
    }
  }
  console.log(`[wipe] Media docs: deleted=${deleted} failed=${failed}`);
  return { deleted, failed };
};

const wipeR2LegacyPrefix = async (): Promise<{ deleted: number }> => {
  const bucket = requireEnv('R2_BUCKET');
  const prefix = (process.env.R2_UPLOAD_PREFIX ?? '').replace(/^\/+|\/+$/g, '');
  const legacyKey = prefix
    ? `${prefix}/media/webflow-migration/`
    : 'media/webflow-migration/';

  const s3 = new S3Client({
    endpoint: requireEnv('R2_ENDPOINT'),
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
    region: 'auto',
    forcePathStyle: true,
  });

  let total = 0;
  let continuationToken: string | undefined;
  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: legacyKey,
        ContinuationToken: continuationToken,
      }),
    );
    const keys = (list.Contents ?? []).map((o) => o.Key).filter(Boolean) as string[];
    if (keys.length > 0) {
      console.log(`[wipe] R2 page: ${keys.length} keys under ${legacyKey}`);
      if (!dryRun) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: keys.map((k) => ({ Key: k })) },
          }),
        );
      }
      total += keys.length;
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`[wipe] R2 legacy prefix: ${total} objects ${dryRun ? '(dry run)' : 'deleted'}`);
  return { deleted: total };
};

const wipeCheckpoints = (): void => {
  if (keepCheckpoints) {
    console.log('[wipe] --keep-checkpoints: skipping checkpoint wipe');
    return;
  }
  const files = [MEDIA_PROGRESS, ASSET_PROGRESS, ASSET_CONTEXT, IMPORT_LOG, PROGRESS_FILE];
  for (const f of files) {
    if (fs.existsSync(f)) {
      if (!dryRun) fs.rmSync(f, { force: true });
      console.log(`[wipe] checkpoint: ${path.basename(f)} ${dryRun ? '(dry run)' : 'removed'}`);
    }
  }
  if (!keepRaw && fs.existsSync(TRANSFORMED_DIR)) {
    if (!dryRun) fs.rmSync(TRANSFORMED_DIR, { recursive: true, force: true });
    console.log(`[wipe] transformed/ ${dryRun ? '(dry run)' : 'removed'}`);
  }
  if (!keepRaw && fs.existsSync(RAW_DIR)) {
    if (!dryRun) fs.rmSync(RAW_DIR, { recursive: true, force: true });
    console.log(`[wipe] raw/ ${dryRun ? '(dry run)' : 'removed'}`);
  }
};

const run = async (): Promise<void> => {
  console.log(`[wipe] ${dryRun ? 'DRY RUN — ' : ''}Webflow media wipe`);
  await wipeMediaDocs();
  await wipeR2LegacyPrefix();
  wipeCheckpoints();
  console.log('[wipe] Done.');
  process.exit(0);
};

run().catch((err) => {
  console.error('[wipe] Fatal:', err);
  process.exit(1);
});
