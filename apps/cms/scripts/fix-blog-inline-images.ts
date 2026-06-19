/**
 * Targeted fix: restore missing inline body images on specific Webflow blogs
 * that the original one-shot backfill (scripts/backfill-blog-body-images.ts)
 * did not cover or covered before Webflow gained more images:
 *
 *   - understanding-image-provenance — seeded post-migration; body had 0 of 5
 *     inline images (the seed only handled the hero).
 *   - why-vulnerability-scanning-alone-is-not-enough — migrated with 1 image;
 *     Webflow has since grown to 3.
 *
 * Strategy (per target blog):
 *   1. Read the CURRENT Webflow body HTML from the fresh export
 *      (migrations/webflow-export/raw/blogs.jsonl) — the source of truth.
 *   2. Extract its inline <img> srcs (in order).
 *   3. Reuse the media already referenced by the blog's existing body upload
 *      nodes for the unchanged leading images (positional), and upload only
 *      the genuinely new images to Media — so no duplicate/orphan media.
 *   4. Regenerate the body via the fixed htmlToLexical (with an image resolver)
 *      so upload nodes land at their original positions, and payload.update.
 *
 * Idempotent: a target whose body already contains an upload node for every
 * current inline image is left untouched.
 *
 * Run from apps/cms with the prod env loaded (DB via tunnel, R2 = prod):
 *   node --env-file=<prod.env> --import tsx/esm scripts/fix-blog-inline-images.ts --dry-run
 *   node --env-file=<prod.env> --import tsx/esm scripts/fix-blog-inline-images.ts
 *
 * Optional: pass slugs as args to override the default target list.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { htmlToLexical } from '../src/payload/lib/webflow-import/html-to-lexical.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const RAW_BLOGS = path.join(REPO_ROOT, 'migrations/webflow-export/raw/blogs.jsonl');

const dryRun = process.argv.includes('--dry-run');
const slugArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const TARGET_SLUGS =
  slugArgs.length > 0
    ? slugArgs
    : ['understanding-image-provenance', 'why-vulnerability-scanning-alone-is-not-enough'];

const IMG_SRC_RE = /<img[^>]+src="(https:\/\/cdn\.prod\.website-files\.com[^"]+)"[^>]*>/g;
const IMG_ALT_RE = /alt="([^"]*)"/;

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

type Payload = Awaited<ReturnType<typeof getPayload>>;

const extractImages = (html: string): { src: string; alt: string }[] => {
  const out: { src: string; alt: string }[] = [];
  for (const m of html.matchAll(IMG_SRC_RE)) {
    out.push({ src: m[1], alt: m[0].match(IMG_ALT_RE)?.[1] ?? '' });
  }
  return out;
};

const fileExtFromUrl = (url: string): string => {
  const clean = url.split('?')[0];
  const dot = clean.lastIndexOf('.');
  const ext = dot >= 0 ? clean.slice(dot + 1).toLowerCase() : 'png';
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'png';
};

/** Collect upload-node media ids from a Lexical body, in document order. */
const uploadMediaIds = (node: unknown, acc: number[] = []): number[] => {
  if (Array.isArray(node)) {
    for (const c of node) uploadMediaIds(c, acc);
  } else if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if (n.type === 'upload') {
      const v = n.value;
      const id =
        typeof v === 'number'
          ? v
          : typeof v === 'object' && v
            ? (v as { id?: number }).id
            : undefined;
      if (typeof id === 'number') acc.push(id);
    }
    for (const v of Object.values(n)) uploadMediaIds(v, acc);
  }
  return acc;
};

const loadWebflowHtml = async (): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  const rl = readline.createInterface({ input: fs.createReadStream(RAW_BLOGS) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const r = JSON.parse(line) as Record<string, unknown>;
    const slug = typeof r.slug === 'string' ? r.slug : null;
    const html =
      (typeof r['main-text'] === 'string' && r['main-text']) ||
      (typeof r['post-body'] === 'string' && r['post-body']) ||
      '';
    if (slug) map.set(slug, html as string);
  }
  return map;
};

const main = async (): Promise<void> => {
  console.log(`[fix-inline] ${dryRun ? 'DRY RUN — ' : ''}targets: ${TARGET_SLUGS.join(', ')}`);
  const html = await loadWebflowHtml();
  const payload = await getPayload({ config });

  let updated = 0;
  let uploaded = 0;
  let reused = 0;

  for (const slug of TARGET_SLUGS) {
    const sourceHtml = html.get(slug);
    if (!sourceHtml) {
      console.warn(`  ! ${slug}: not found in Webflow export — skipping`);
      continue;
    }
    const images = extractImages(sourceHtml);

    const found = await payload.find({
      collection: 'blogs',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
    });
    const doc = found.docs[0] as { id: number | string; body?: unknown } | undefined;
    if (!doc) {
      console.warn(`  ! ${slug}: not found in CMS — skipping`);
      continue;
    }

    const existingIds = uploadMediaIds(doc.body);
    if (existingIds.length >= images.length && images.length > 0) {
      console.log(
        `  ✓ ${slug}: already has ${existingIds.length}/${images.length} inline images — skipping`,
      );
      continue;
    }

    console.log(
      `  • ${slug}: webflow=${images.length} inline, existing upload nodes=${existingIds.length}`,
    );

    // Build the src -> media-id resolver. Reuse existing media for the
    // unchanged leading images (positional), upload the rest.
    const map = new Map<string, number>();
    for (let i = 0; i < images.length; i += 1) {
      const { src, alt } = images[i];
      if (i < existingIds.length) {
        map.set(src, existingIds[i]);
        reused += 1;
        console.log(`      [${i + 1}] reuse existing media id=${existingIds[i]}`);
        continue;
      }
      const ext = fileExtFromUrl(src);
      if (dryRun) {
        console.log(`      [${i + 1}] WOULD upload ${src.split('/').pop()}`);
        continue;
      }
      const res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`download ${res.status} for ${src}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const created = await payload.create({
        collection: 'media',
        data: { alt: alt || slug } as Parameters<typeof payload.create>[0]['data'],
        file: {
          data: buffer,
          mimetype: MIME[ext] ?? 'image/png',
          name: `${slug}-body-${i + 1}.${ext}`,
          size: buffer.byteLength,
        },
        overrideAccess: true,
      });
      const id = (created as { id: number }).id;
      map.set(src, id);
      uploaded += 1;
      console.log(`      [${i + 1}] uploaded media id=${id}`);
    }

    if (dryRun) {
      console.log(`  • ${slug}: WOULD regenerate body with ${images.length} upload nodes`);
      continue;
    }

    const nextBody = htmlToLexical(sourceHtml, {
      resolveImage: (src) => {
        const id = map.get(src);
        return id != null ? { id } : null;
      },
    });
    const placed = uploadMediaIds(nextBody).length;
    if (placed < images.length) {
      console.warn(
        `  ⚠ ${slug}: placed ${placed}/${images.length} images (src mismatch on the rest)`,
      );
    }
    await payload.update({
      collection: 'blogs',
      id: doc.id,
      data: { body: nextBody } as Parameters<typeof payload.update>[0]['data'],
      overrideAccess: true,
    });
    updated += 1;
    console.log(`  ✓ ${slug}: body updated (${placed}/${images.length} inline images)`);
  }

  console.log(`\n[fix-inline] Done. updated=${updated} uploaded=${uploaded} reused=${reused}`);
  process.exit(0);
};

main().catch((err) => {
  console.error('[fix-inline] Fatal:', err);
  process.exit(1);
});
