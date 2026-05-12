/**
 * H4 — Rewrite body URLs
 *
 * Walks every transformed JSONL file and replaces Webflow CDN URLs
 * (uploads-ssl.webflow.com, uploads.webflow.com) with R2 public URLs.
 * Uses the asset checkpoint from H5 to map source → R2 URL.
 *
 * Usage:
 *   tsx migrations/webflow-import/rewrite-body-urls.ts
 *   tsx migrations/webflow-import/rewrite-body-urls.ts --dry-run
 *
 * Input:  migrations/webflow-export/transformed/<collection>.jsonl
 *         migrations/webflow-export/.asset-progress.json
 * Output: migrations/webflow-export/transformed/<collection>.jsonl (in-place)
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const TRANSFORMED_DIR = path.resolve('migrations/webflow-export/transformed');
const ASSET_PROGRESS = path.resolve('migrations/webflow-export/.asset-progress.json');

const dryRun = process.argv.includes('--dry-run');

const WEBFLOW_CDN_RE = /https:\/\/uploads(?:-ssl)?\.webflow\.com\/[^\s"')>]+/g;

type AssetRecord = { webflowUrl: string; r2PublicUrl: string; sha256: string };

const loadAssetMap = (): Map<string, string> => {
  const map = new Map<string, string>();
  if (!fs.existsSync(ASSET_PROGRESS)) return map;
  try {
    const records = JSON.parse(fs.readFileSync(ASSET_PROGRESS, 'utf-8')) as AssetRecord[];
    for (const r of records) {
      if (r.webflowUrl && r.r2PublicUrl) map.set(r.webflowUrl, r.r2PublicUrl);
    }
  } catch {
    // ignore
  }
  return map;
};

const rewriteUrls = (text: string, assetMap: Map<string, string>): { text: string; rewrites: number } => {
  let rewrites = 0;
  const result = text.replace(WEBFLOW_CDN_RE, (match) => {
    const mapped = assetMap.get(match);
    if (mapped) { rewrites += 1; return mapped; }
    return match;
  });
  return { text: result, rewrites };
};

const processCollection = async (jsonlFile: string, assetMap: Map<string, string>): Promise<void> => {
  const slug = path.basename(jsonlFile, '.jsonl');
  const tmpFile = `${jsonlFile}.tmp`;

  const rl = readline.createInterface({ input: fs.createReadStream(jsonlFile) });
  const writeStream = dryRun ? null : fs.createWriteStream(tmpFile);

  let totalRewrites = 0;
  let rows = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    rows += 1;
    const { text, rewrites } = rewriteUrls(line, assetMap);
    totalRewrites += rewrites;
    writeStream?.write(text + '\n');
  }

  writeStream?.end();

  if (!dryRun && totalRewrites > 0) {
    fs.renameSync(tmpFile, jsonlFile);
  } else if (!dryRun) {
    fs.rmSync(tmpFile, { force: true });
  }

  console.log(`[rewrite-urls] ${slug}: ${rows} rows, ${totalRewrites} URL rewrites${dryRun ? ' (dry run)' : ''}`);
};

const run = async (): Promise<void> => {
  console.log(`[rewrite-urls] ${dryRun ? 'DRY RUN — ' : ''}Rewriting Webflow CDN URLs`);

  const assetMap = loadAssetMap();
  console.log(`[rewrite-urls] Asset map: ${assetMap.size} entries`);

  if (!fs.existsSync(TRANSFORMED_DIR)) {
    console.error('[rewrite-urls] Transformed dir not found. Run transform/index.ts first.');
    process.exit(1);
  }

  const files = fs.readdirSync(TRANSFORMED_DIR).filter((f) => f.endsWith('.jsonl'));
  for (const file of files) {
    await processCollection(path.join(TRANSFORMED_DIR, file), assetMap);
  }

  console.log('[rewrite-urls] Done.');
};

run().catch((err) => {
  console.error('[rewrite-urls] Fatal:', err);
  process.exit(1);
});
