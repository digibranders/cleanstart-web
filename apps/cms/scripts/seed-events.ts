/**
 * Targeted event seed — import specific events from the Webflow export into the
 * CMS, uploading their media (hero image + gallery) to R2. Unlike the full
 * `import.ts`, this only touches the events you name, so it's safe to run
 * against prod for a single new/changed event.
 *
 * Reuses `transformEvent` (so body HTML → Lexical, field mapping, etc. stay
 * identical to the full import) and upserts by slug (update existing, create
 * new). Media is deduped by filename so re-runs don't re-upload.
 *
 * Usage (local):
 *   pnpm --filter @cleanstart/cms exec tsx --env-file=.env \
 *     ../../migrations/webflow-import/seed-events.ts <slug> [<slug> …] [--dry-run]
 * Or with explicit env (prod via tunnel):
 *   DATABASE_URI=… PAYLOAD_SECRET=… R2_*=… tsx migrations/webflow-import/seed-events.ts <slug>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Payload } from 'payload';

// `payload`, the config, and the transform are imported DYNAMICALLY inside run()
// — a static import of payload.config eval-triggers Payload's loadEnv before
// tsx finishes its CJS interop, which crashes on @next/env. Type-only imports
// (above) are erased, so they're safe.

// Resolve the export relative to THIS file, so the script works regardless of
// the working directory it's launched from (e.g. cwd=apps/cms for env loading).
const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.resolve(HERE, '../../../migrations/webflow-export/raw/events.jsonl');
const dryRun = process.argv.includes('--dry-run');
const targetSlugs = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const refUrl = (ref: unknown): string | null => {
  if (typeof ref === 'string' && ref.trim()) return ref.trim();
  if (ref && typeof ref === 'object' && typeof (ref as { url?: unknown }).url === 'string') {
    return (ref as { url: string }).url;
  }
  return null;
};

const filenameFromUrl = (url: string): string => {
  const base = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? 'image');
  return base.length > 0 ? base : 'image';
};

/** Upload (or reuse) a media doc for a Webflow asset URL; returns the media id. */
const ensureMedia = async (
  payload: Payload,
  url: string | null,
  alt: string | null,
): Promise<number | null> => {
  if (!url) return null;
  const filename = filenameFromUrl(url);
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existing.docs[0]) return (existing.docs[0] as { id: number }).id;
  if (dryRun) {
    console.log(`  [seed] DRY: would upload media ${filename} from ${url}`);
    return null;
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  [seed] media fetch failed ${res.status} for ${url}`);
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const mimetype = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
  const created = await payload.create({
    collection: 'media',
    data: (alt ? { alt } : {}) as Record<string, unknown>,
    file: { data: buf, mimetype, name: filename, size: buf.length },
    overrideAccess: true,
  });
  console.log(`  [seed] uploaded media ${filename} → id ${(created as { id: number }).id}`);
  return (created as { id: number }).id;
};

const run = async (): Promise<void> => {
  const { getPayload } = await import('payload');
  const { default: config } = await import('../src/payload.config');
  const { transformEvent } = await import(
    '../../../migrations/webflow-import/transform/events'
  );
  const payload = await getPayload({ config });
  const rows = fs
    .readFileSync(RAW, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Record<string, unknown>);
  const selected =
    targetSlugs.length > 0 ? rows.filter((r) => targetSlugs.includes(r.slug as string)) : rows;

  console.log(`[seed] ${selected.length} event(s) selected${dryRun ? ' (DRY RUN)' : ''}`);

  for (const row of selected) {
    const t = transformEvent(row);
    const slug = t.slug as string;
    const heroId = await ensureMedia(payload, refUrl(t._rawHeroImage), (row.name as string) ?? null);
    const gallery: Array<{ image: number }> = [];
    for (const g of (t._rawGallery as Array<{ url: string; alt: string | null }> | null) ?? []) {
      const id = await ensureMedia(payload, g.url, g.alt);
      if (id != null) gallery.push({ image: id });
    }

    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(t)) {
      if (k.startsWith('_') && k !== '_status') continue;
      if (v !== undefined) data[k] = v;
    }
    if (heroId != null) data.heroImage = heroId;
    if (gallery.length > 0) data.gallery = gallery;

    if (dryRun) {
      console.log(`[seed] DRY ${slug}: hero=${heroId ?? '-'} gallery=${gallery.length}`);
      continue;
    }

    const existing = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      await payload.update({
        collection: 'events',
        id: (existing.docs[0] as { id: number }).id,
        data,
        overrideAccess: true,
      });
      console.log(`[seed] updated event ${slug}`);
    } else {
      await payload.create({ collection: 'events', data, overrideAccess: true });
      console.log(`[seed] created event ${slug}`);
    }
  }
  console.log('[seed] done.');
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
