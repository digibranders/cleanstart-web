/**
 * Sync `_status` (and Jobs `hiringStatus`) from the transformed Webflow data
 * onto existing CMS records, matching the source site's draft/published state.
 * Surgical: looks up by slug and updates only those fields — no media or
 * relationship churn. Idempotent.
 *
 * Usage:
 *   DATABASE_URI=... PAYLOAD_SECRET=... tsx migrations/webflow-import/sync-status.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import config from '../../apps/cms/src/payload.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSFORMED = path.resolve(dirname, '..', '..', 'migrations/webflow-export/transformed');

const COLLECTIONS = [
  'blogs',
  'news',
  'guides',
  'resources',
  'events',
  'webinars',
  'jobs',
  'aboutGalleries',
  'categories',
  'newsCategories',
] as const;

const main = async (): Promise<void> => {
  const payload = await getPayload({ config });
  for (const col of COLLECTIONS) {
    const file = path.join(TRANSFORMED, `${col}.jsonl`);
    if (!fs.existsSync(file)) continue;
    const lines = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    let updated = 0;
    let drafted = 0;
    let closed = 0;
    for (const line of lines) {
      const row = JSON.parse(line) as { slug?: unknown; _status?: unknown; hiringStatus?: unknown };
      if (typeof row.slug !== 'string') continue;
      const status = row._status === 'draft' ? 'draft' : 'published';
      // Payload's slug field collapses repeated dashes, so the imported slug
      // can differ from the transformed one — fall back to the normalized form.
      const candidates = [row.slug, row.slug.replace(/-{2,}/g, '-')].filter(
        (s, i, a) => a.indexOf(s) === i,
      );
      let doc: { id: number } | undefined;
      for (const candidate of candidates) {
        const found = await payload.find({
          collection: col as never,
          where: { slug: { equals: candidate } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        doc = found.docs[0] as { id: number } | undefined;
        if (doc) break;
      }
      if (!doc) {
        console.warn(`  [sync] ${col}/${row.slug}: not found`);
        continue;
      }
      const data: Record<string, unknown> = { _status: status };
      if (col === 'jobs' && typeof row.hiringStatus === 'string') {
        data.hiringStatus = row.hiringStatus;
      }
      await payload.update({
        collection: col as never,
        id: doc.id,
        data: data as never,
        overrideAccess: true,
      });
      updated += 1;
      if (status === 'draft') drafted += 1;
      if (data.hiringStatus === 'closed') closed += 1;
    }
    const extra = col === 'jobs' ? `, ${closed} hiringStatus=closed` : '';
    console.log(`[sync] ${col}: ${updated} updated (${drafted} → draft${extra})`);
  }
  process.exit(0);
};

main().catch((err) => {
  console.error('[sync] Fatal:', err);
  process.exit(1);
});
