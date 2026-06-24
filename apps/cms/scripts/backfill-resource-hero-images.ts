#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: restore resource cover images from the Webflow export.
 *
 * Every Webflow resource carried a `feature-image` (a cover), but the
 * resources collection had no `heroImage` field at import time, so the
 * transform captured the URL as `_rawHeroImage` and the import dropped it.
 * Now that `resources.heroImage` exists (migration
 * 20260624_120000_add_resources_hero_image), this uploads each cover to the
 * Media library and sets `heroImage` on the matching resource (by slug).
 *
 * Self-contained: the 27 covers (slug + Webflow CDN URL + alt + title) are
 * committed in `scripts/data/resource-hero-images.json`, so the droplet
 * doesn't need the `migrations/` export. Source images are pulled from the
 * still-live Webflow CDN (`cdn.prod.website-files.com`) — run BEFORE that CDN
 * is torn down.
 *
 * Writes via `payload.update`. Setting `heroImage` on an already-published
 * resource is a re-save, so the Teams (`webhooks-publish`) + IndexNow hooks
 * are publish-transition-gated and do NOT fire; the only afterChange effects
 * are a Meilisearch re-sync, a web revalidate (desired — the cover appears on
 * the detail page), and a version row per resource. Run in a quiet window.
 *
 * Idempotent / safe:
 *   - a resource that ALREADY has a `heroImage` is skipped (never clobbers an
 *     editor-set cover);
 *   - a cover whose derived filename already exists in Media is reused, not
 *     re-uploaded;
 *   - a slug absent from the CMS is logged and skipped.
 *
 * Flags:
 *   --dry-run   Report per resource (would set / already has / missing)
 *               without downloading, uploading, or writing.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-resource-hero-images.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-resource-hero-images.ts
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

interface CoverEntry {
  slug: string;
  url: string;
  alt: string;
  title: string;
}

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const dataPath = fileURLToPath(new URL('./data/resource-hero-images.json', import.meta.url));
const covers = JSON.parse(readFileSync(dataPath, 'utf-8')) as CoverEntry[];

const fileExtFromUrl = (url: string): string => {
  const clean = url.split('?')[0];
  const dot = clean.lastIndexOf('.');
  const ext = dot >= 0 ? clean.slice(dot + 1).toLowerCase() : 'jpg';
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'jpg';
};

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`\nMode: ${DRY_RUN ? 'DRY RUN (no downloads / uploads / writes)' : 'WRITE via payload.update'}\n`);

  let scanned = 0;
  let updated = 0;
  let skippedHasCover = 0;
  let skippedMissing = 0;
  let uploaded = 0;
  let reused = 0;
  let errors = 0;

  for (const entry of covers) {
    scanned += 1;
    const { slug, url, alt, title } = entry;

    const found = await payload.find({
      collection: 'resources',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
    });
    const doc = found.docs[0] as Record<string, unknown> | undefined;
    if (!doc) {
      skippedMissing += 1;
      log(`  ! not found in CMS: ${slug}`);
      continue;
    }

    // `heroImage` at depth 0 is the media id (number) or null/undefined.
    if (doc.heroImage != null) {
      skippedHasCover += 1;
      continue;
    }

    if (DRY_RUN) {
      log(`  would set cover: ${slug}`);
      updated += 1;
      continue;
    }

    try {
      const ext = fileExtFromUrl(url);
      const filename = `${slug}-cover.${ext}`;

      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: filename } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      let mediaId = existing.docs[0]?.id as number | undefined;

      if (mediaId == null) {
        const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`download ${res.status} for ${url}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const created = await payload.create({
          collection: 'media',
          data: { alt: alt || title || slug },
          file: {
            data: buffer,
            mimetype: MIME[ext] ?? 'image/jpeg',
            name: filename,
            size: buffer.byteLength,
          },
          overrideAccess: true,
        });
        mediaId = created.id as number;
        uploaded += 1;
      } else {
        reused += 1;
      }

      await payload.update({
        collection: 'resources',
        id: doc.id as string | number,
        data: { heroImage: mediaId } as Record<string, unknown>,
        overrideAccess: true,
      });
      updated += 1;
      log(`  set cover: ${slug} -> media#${mediaId}`);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console -- script output
      console.error(`  ! ${slug}: ${message}`);
    }
  }

  log(
    `\nDone. scanned=${scanned} updated=${updated} skipped(has-cover)=${skippedHasCover} ` +
      `skipped(missing)=${skippedMissing} media(uploaded=${uploaded} reused=${reused}) errors=${errors}`,
  );

  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console -- script output
  console.error(err);
  process.exit(1);
});
