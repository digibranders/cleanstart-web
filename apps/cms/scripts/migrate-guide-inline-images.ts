/**
 * Restore inline body images on Webflow-imported GUIDES.
 *
 * The guide migration ran `htmlToLexical(main-text)` without an image resolver,
 * so every inline <img> was dropped — 31 published guides (62 images) lost their
 * body images. This re-runs the guide body transform WITH a resolver so the
 * images come back at their original positions.
 *
 * Faithful to the original guide transform (transform/guides.ts): body is
 *   htmlToLexical(bodyHtml, { resolveImage })  then  stripInlineFaqSection(...)
 * when the guide has structured FAQs — so the inline FAQ duplicate stays
 * stripped exactly as the import produced it.
 *
 * Data-only: the web renderer already renders upload nodes (with the intrinsic
 * width cap), so no deploy is needed.
 *
 * Idempotent: a guide whose body already has an upload node is skipped; an image
 * whose derived filename already exists in Media is reused, not re-uploaded.
 *
 * Run from apps/cms with the prod env loaded (DB via tunnel, R2 = prod):
 *   node --env-file=<prod.env> --import tsx/esm scripts/migrate-guide-inline-images.ts --dry-run
 *   node --env-file=<prod.env> --import tsx/esm scripts/migrate-guide-inline-images.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { htmlToLexical } from '../src/payload/lib/webflow-import/html-to-lexical.ts';
import { normalizeWebflowGuide } from '../src/payload/lib/webflow-import/guides-normalize.ts';
import { stripInlineFaqSection } from '../src/payload/lib/webflow-import/strip-faqs.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const RAW_GUIDES = path.join(REPO_ROOT, 'migrations/webflow-export/raw/guides.jsonl');

const dryRun = process.argv.includes('--dry-run');

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

type LexNode = Record<string, unknown>;

const extractImages = (html: string): { src: string; alt: string }[] => {
  const out: { src: string; alt: string }[] = [];
  for (const m of html.matchAll(IMG_SRC_RE)) out.push({ src: m[1], alt: m[0].match(IMG_ALT_RE)?.[1] ?? '' });
  return out;
};

const fileExtFromUrl = (url: string): string => {
  const clean = url.split('?')[0];
  const dot = clean.lastIndexOf('.');
  const ext = dot >= 0 ? clean.slice(dot + 1).toLowerCase() : 'png';
  return /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'png';
};

const hasUpload = (node: unknown): boolean => {
  if (Array.isArray(node)) return node.some(hasUpload);
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if (n.type === 'upload') return true;
    return Object.values(n).some(hasUpload);
  }
  return false;
};

const countUploads = (node: unknown): number => {
  if (Array.isArray(node)) return node.reduce((a: number, c) => a + countUploads(c), 0);
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    return (n.type === 'upload' ? 1 : 0) + Object.values(n).reduce((a: number, c) => a + countUploads(c), 0);
  }
  return 0;
};

const loadRaw = async (): Promise<Map<string, LexNode>> => {
  const map = new Map<string, LexNode>();
  const rl = readline.createInterface({ input: fs.createReadStream(RAW_GUIDES) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const r = JSON.parse(line) as LexNode;
    if (typeof r.slug === 'string') map.set(r.slug, r);
  }
  return map;
};

const main = async (): Promise<void> => {
  console.log(`[guide-imgs] ${dryRun ? 'DRY RUN — ' : ''}restoring guide inline images`);
  const raw = await loadRaw();
  const payload = await getPayload({ config });

  let updated = 0;
  let skipped = 0;
  let uploaded = 0;
  let reused = 0;
  let failed = 0;

  for (const [slug, row] of raw) {
    const bodyHtml = typeof row['main-text'] === 'string' ? (row['main-text'] as string) : '';
    const images = extractImages(bodyHtml);
    if (images.length === 0) continue;

    const found = await payload.find({
      collection: 'guides',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
    });
    const doc = found.docs[0] as { id: number | string; body?: unknown } | undefined;
    if (!doc) continue; // draft / not published
    if (hasUpload(doc.body)) {
      skipped += 1;
      continue;
    }

    console.log(`  • ${slug}: ${images.length} image(s)`);
    try {
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
        if (dryRun) {
          console.log(`      [${i + 1}] WOULD upload ${src.split('/').pop()}`);
          continue;
        }
        const res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`download ${res.status} for ${src}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const created = await payload.create({
          collection: 'media',
          data: { alt: alt || slug, folder: 'web/guide' } as Parameters<typeof payload.create>[0]['data'],
          file: { data: buffer, mimetype: MIME[ext] ?? 'image/png', name: filename, size: buffer.byteLength },
          overrideAccess: true,
        });
        map.set(src, created.id as number);
        uploaded += 1;
      }

      if (dryRun) {
        console.log(`  • ${slug}: WOULD regenerate body with ${images.length} images`);
        continue;
      }

      // Mirror transform/guides.ts body construction, with the resolver.
      const { faqs } = normalizeWebflowGuide(row);
      const lexicalBody = htmlToLexical(bodyHtml, {
        resolveImage: (src) => {
          const id = map.get(src);
          return id != null ? { id } : null;
        },
      });
      const body = faqs.length > 0 ? stripInlineFaqSection(lexicalBody) : lexicalBody;

      const placed = countUploads(body);
      if (placed < images.length) console.warn(`  ⚠ ${slug}: placed ${placed}/${images.length}`);

      await payload.update({
        collection: 'guides',
        id: doc.id,
        data: { body } as Parameters<typeof payload.update>[0]['data'],
        overrideAccess: true,
      });
      console.log(`  ✓ ${slug}: body updated (${placed}/${images.length} images)`);
      updated += 1;
    } catch (err) {
      failed += 1;
      console.error(`  ! ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(
    `\n[guide-imgs] Done. updated=${updated} skipped=${skipped} images(uploaded=${uploaded} reused=${reused}) failed=${failed}`,
  );
  process.exit(failed > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('[guide-imgs] Fatal:', err);
  process.exit(1);
});
