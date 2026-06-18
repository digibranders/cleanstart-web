#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: restore inline body images on Webflow-imported blogs.
 *
 * The old HTML→Lexical converter dropped `<img>` tags entirely, so 17 blogs
 * (38 images) lost their inline body images — present in Webflow, absent on our
 * pages. The converter now emits `upload` nodes when given an image resolver
 * (`html-to-lexical.ts` `ImageResolver`). This script uploads each image to the
 * Media library and regenerates the affected blog bodies through the fixed
 * converter, so the images land at their original positions.
 *
 * Self-contained: the 17 blogs' original Webflow HTML is committed in
 * `scripts/data/blog-body-images.json` (so the droplet doesn't need the raw
 * export). Source images are pulled from the still-live Webflow CDN.
 *
 * Why regenerate the whole body is safe for blogs: the blog import transform is
 * exactly `htmlToLexical(main-text)` and nothing else (FAQ-strip / CTA-card
 * passes are guides-only). Re-running it with the resolver reproduces the import
 * output plus images — and also drops any leaked `<style>` block (DROP_TAGS), so
 * a blog with both problems is fixed in one pass. Caveat: a body hand-edited in
 * the admin after import would be reverted to the import output — review the
 * dry-run list first.
 *
 * Writes via `payload.update` so `bodyStatsHook` recomputes TOC/word count and
 * `normalizeLexicalHook` runs. Teams/IndexNow are publish-transition-gated (no
 * fire on re-save of a published blog); the only afterChange effects are a
 * Meilisearch re-sync, a web revalidate (desired — the images appear), and a
 * version row per blog. Run in a quiet window.
 *
 * Idempotent:
 *   - a blog whose body already contains `upload` nodes is skipped;
 *   - an image whose derived filename already exists in Media is reused, not
 *     re-uploaded.
 *
 * Flags:
 *   --dry-run   Report per blog (images needed, already-done) without
 *               downloading, uploading, or writing.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-blog-body-images.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-blog-body-images.ts
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { htmlToLexical } from '../src/payload/lib/webflow-import/html-to-lexical';

interface BlogEntry {
  slug: string;
  html: string;
  imageCount: number;
}

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const dataPath = fileURLToPath(new URL('./data/blog-body-images.json', import.meta.url));
const blogs = JSON.parse(readFileSync(dataPath, 'utf-8')) as BlogEntry[];

const IMG_SRC_RE = /<img[^>]+src="(https:\/\/cdn\.prod\.website-files\.com[^"]+)"[^>]*>/g;
const IMG_ALT_RE = /alt="([^"]*)"/;

const extractImages = (html: string): { src: string; alt: string }[] => {
  const out: { src: string; alt: string }[] = [];
  for (const m of html.matchAll(IMG_SRC_RE)) {
    out.push({ src: m[1], alt: m[0].match(IMG_ALT_RE)?.[1] ?? '' });
  }
  return out;
};

/** True when a Lexical body already contains an `upload` node (idempotency). */
const hasUploadNode = (node: unknown): boolean => {
  if (Array.isArray(node)) return node.some(hasUploadNode);
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if (n.type === 'upload') return true;
    return Object.values(n).some(hasUploadNode);
  }
  return false;
};

const countUploadNodes = (node: unknown): number => {
  if (Array.isArray(node)) return node.reduce((a, c) => a + countUploadNodes(c), 0);
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    const self = n.type === 'upload' ? 1 : 0;
    return self + Object.values(n).reduce((a, c) => a + countUploadNodes(c), 0);
  }
  return 0;
};

const fileExtFromUrl = (url: string): string => {
  const clean = url.split('?')[0];
  const dot = clean.lastIndexOf('.');
  const ext = dot >= 0 ? clean.slice(dot + 1).toLowerCase() : 'png';
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'png';
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
  let skippedDone = 0;
  let skippedMissing = 0;
  let uploaded = 0;
  let reused = 0;
  let errors = 0;

  for (const entry of blogs) {
    scanned += 1;
    const { slug, html } = entry;

    const found = await payload.find({
      collection: 'blogs',
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

    if (hasUploadNode(doc.body)) {
      skippedDone += 1;
      continue;
    }

    const images = extractImages(html);
    if (DRY_RUN) {
      log(`  would backfill: ${slug} (${images.length} image${images.length === 1 ? '' : 's'})`);
      updated += 1;
      continue;
    }

    try {
      // Upload (or reuse) each image, building the src→media-id resolver map.
      const map = new Map<string, number>();
      for (let i = 0; i < images.length; i += 1) {
        const { src, alt } = images[i];
        const ext = fileExtFromUrl(src);
        const filename = `${slug}-body-${i + 1}.${ext}`;

        const existing = await payload.find({
          collection: 'media',
          where: { filename: { equals: filename } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        const existingId = existing.docs[0]?.id as number | undefined;
        if (existingId != null) {
          map.set(src, existingId);
          reused += 1;
          continue;
        }

        const res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`download ${res.status} for ${src}`);
        const buffer = Buffer.from(await res.arrayBuffer());

        const created = await payload.create({
          collection: 'media',
          data: { alt: alt || slug },
          file: {
            data: buffer,
            mimetype: MIME[ext] ?? 'image/png',
            name: filename,
            size: buffer.byteLength,
          },
          overrideAccess: true,
        });
        map.set(src, created.id as number);
        uploaded += 1;
      }

      const nextBody = htmlToLexical(html, {
        resolveImage: (src) => {
          const id = map.get(src);
          return id != null ? { id } : null;
        },
      });

      const placed = countUploadNodes(nextBody);
      if (placed < images.length) {
        log(`  ⚠ ${slug}: placed ${placed}/${images.length} images (src mismatch on the rest)`);
      }

      await payload.update({
        collection: 'blogs',
        id: doc.id as string | number,
        data: { body: nextBody } as Record<string, unknown>,
        overrideAccess: true,
      });
      updated += 1;
      log(`  backfilled: ${slug} (${placed}/${images.length} images)`);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console -- script output
      console.error(`  ! ${slug}: ${message}`);
    }
  }

  log(
    `\nDone. scanned=${scanned} updated=${updated} skipped(done)=${skippedDone} ` +
      `skipped(missing)=${skippedMissing} images(uploaded=${uploaded} reused=${reused}) errors=${errors}`,
  );
  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
