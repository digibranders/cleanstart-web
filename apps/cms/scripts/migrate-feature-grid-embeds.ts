/**
 * Restore Webflow `feature-grid` rich-text embeds that the HTML→Lexical
 * migration flattened into a vertical stack of images + headings.
 *
 * Webflow authored these as a horizontal grid:
 *   <div data-rt-embed-type><section class="feature-section">
 *     <div class="feature-grid">
 *       <div class="feature-item"><img alt="Time"><h3>Time</h3></div> … </div>
 *   </section></div>
 * The converter has no Lexical equivalent, so it unwrapped the grid and the
 * items now render one-per-row. This re-migration replaces each feature-grid
 * region with an `EmbedNode` (already registered in the editor) that preserves
 * the original markup in `rawHtml`; the web renderer's `embed` case + the
 * ported `.feature-grid` CSS lay it back out as a row.
 *
 * Image handling: the grid's images already live in the Media library (they
 * were imported as upload nodes when the grid was flattened). We pair the body's
 * existing upload-node media with the source images in document order and rewrite
 * the embed's <img src> to the R2 CDN URLs — so no media is duplicated and the
 * non-grid images keep their responsive upload-node treatment.
 *
 * Idempotent: a blog whose body already contains an `embed` node is skipped.
 *
 * PREREQUISITE: the web frontend must already render the `embed` node in prod,
 * otherwise the migrated grids render as nothing. Deploy web first, then run this.
 *
 * Run from apps/cms with the prod env loaded (DB via tunnel, R2 = prod):
 *   node --env-file=<prod.env> --import tsx/esm scripts/migrate-feature-grid-embeds.ts --dry-run
 *   node --env-file=<prod.env> --import tsx/esm scripts/migrate-feature-grid-embeds.ts
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

const WF_CDN_RE = /https:\/\/(?:cdn\.prod\.website-files\.com|uploads(?:-ssl)?\.webflow\.com)\/[^\s"<>]+/g;
const cleanseUrl = (u: string): string => u.replace(/[.,;]+$/, '');

type LexNode = Record<string, unknown>;

/** Build a fresh, schema-valid EmbedNode carrying the preserved embed markup. */
const embedNode = (rawHtml: string): LexNode => ({
  type: 'embed',
  version: 1,
  format: '',
  mode: 'script',
  url: '',
  embedUrl: '',
  provider: 'generic',
  rawHtml,
  title: '',
  aspectRatio: 'auto',
  caption: '',
});

/**
 * Extract every `<div data-rt-embed-type …>…</div>` block from `html` by
 * matching nested `<div>`s, returning each block's full HTML and span.
 */
const extractEmbedBlocks = (html: string): { html: string; start: number; end: number }[] => {
  const blocks: { html: string; start: number; end: number }[] = [];
  const openRe = /<div\b[^>]*\bdata-rt-embed-type\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = openRe.exec(html)) !== null) {
    const start = m.index;
    // Walk forward counting <div>/</div> to find the matching close.
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = start;
    let depth = 0;
    let t: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
    while ((t = tagRe.exec(html)) !== null) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        const end = t.index + t[0].length;
        blocks.push({ html: html.slice(start, end), start, end });
        openRe.lastIndex = end;
        break;
      }
    }
  }
  return blocks;
};

const readJsonl = async (file: string): Promise<LexNode[]> => {
  const rows: LexNode[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  for await (const line of rl) {
    if (line.trim()) rows.push(JSON.parse(line) as LexNode);
  }
  return rows;
};

/** Collect upload-node media `{ id, url }` from a body, in document order. */
const collectUploads = (node: unknown, acc: { id: number; url: string }[] = []): { id: number; url: string }[] => {
  if (Array.isArray(node)) {
    for (const c of node) collectUploads(c, acc);
  } else if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if (n.type === 'upload') {
      const v = n.value as { id?: number; url?: string } | number | undefined;
      if (v && typeof v === 'object' && typeof v.id === 'number') {
        acc.push({ id: v.id, url: typeof v.url === 'string' ? v.url : '' });
      }
    }
    for (const c of Object.values(n)) collectUploads(c, acc);
  }
  return acc;
};

const hasEmbed = (node: unknown): boolean => {
  if (Array.isArray(node)) return node.some(hasEmbed);
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if (n.type === 'embed') return true;
    return Object.values(n).some(hasEmbed);
  }
  return false;
};

const main = async (): Promise<void> => {
  console.log(`[embeds] ${dryRun ? 'DRY RUN — ' : ''}migrating feature-grid embeds`);
  const rawRows = await readJsonl(RAW_BLOGS);
  const rawBySlug = new Map<string, string>();
  for (const r of rawRows) {
    const slug = typeof r.slug === 'string' ? r.slug : null;
    const html = (typeof r['main-text'] === 'string' && r['main-text']) || (typeof r['post-body'] === 'string' && r['post-body']) || '';
    if (slug) rawBySlug.set(slug, html as string);
  }

  const payload = await getPayload({ config });
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [slug, html] of rawBySlug) {
    if (!/class="[^"]*feature-grid/.test(html)) continue;

    const found = await payload.find({
      collection: 'blogs',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
      draft: true,
    });
    const doc = found.docs[0] as { id: number | string; body?: unknown } | undefined;
    if (!doc) {
      console.warn(`  ! ${slug}: not in CMS`);
      continue;
    }
    if (hasEmbed(doc.body)) {
      console.log(`  ✓ ${slug}: already has embed node — skipping`);
      skipped += 1;
      continue;
    }

    // Pair every source image (document order) with the body's existing upload
    // media, so we can both resolve upload nodes and rewrite embed <img> srcs.
    const srcs = Array.from(html.matchAll(WF_CDN_RE)).map((mm) => cleanseUrl(mm[0]));
    const uploads = collectUploads(doc.body);
    const srcToMedia = new Map<string, { id: number; url: string }>();
    for (let i = 0; i < srcs.length && i < uploads.length; i += 1) srcToMedia.set(srcs[i], uploads[i]);

    // Replace each feature-grid embed with a placeholder paragraph; stash the
    // embed HTML with its <img> srcs rewritten to the R2 CDN URLs.
    const gridBlocks = extractEmbedBlocks(html).filter((b) => /class="[^"]*feature-grid/.test(b.html));
    if (gridBlocks.length === 0) {
      console.warn(`  ! ${slug}: feature-grid detected but no embed block extracted`);
      continue;
    }
    let modified = '';
    let cursor = 0;
    const embeds: string[] = [];
    gridBlocks.forEach((b, k) => {
      modified += html.slice(cursor, b.start);
      modified += `<p>__EMBED_${k}__</p>`;
      cursor = b.end;
      const rawHtml = b.html.replace(WF_CDN_RE, (u) => {
        const media = srcToMedia.get(cleanseUrl(u));
        return media?.url || u;
      });
      embeds.push(rawHtml);
    });
    modified += html.slice(cursor);

    const body = htmlToLexical(modified, {
      resolveImage: (src) => {
        const media = srcToMedia.get(cleanseUrl(src));
        return media ? { id: media.id } : null;
      },
    }) as { root: { children: LexNode[] } };

    // Swap placeholder paragraphs for the EmbedNodes.
    let placed = 0;
    const isPlaceholder = (n: LexNode): number | null => {
      if (n.type !== 'paragraph') return null;
      const kids = (n.children as LexNode[] | undefined) ?? [];
      if (kids.length !== 1 || kids[0]?.type !== 'text') return null;
      const mm = /^__EMBED_(\d+)__$/.exec(String((kids[0] as { text?: unknown }).text ?? ''));
      return mm ? Number(mm[1]) : null;
    };
    body.root.children = body.root.children.map((n) => {
      const idx = isPlaceholder(n);
      if (idx == null || embeds[idx] == null) return n;
      placed += 1;
      return embedNode(embeds[idx]);
    });

    if (placed !== embeds.length) {
      console.warn(`  ⚠ ${slug}: placed ${placed}/${embeds.length} embeds`);
    }

    if (dryRun) {
      console.log(`  • WOULD update ${slug}: ${embeds.length} feature-grid embed(s), ${uploads.length} media paired`);
      console.log(`      embed rawHtml preview: ${embeds[0].replace(/\s+/g, ' ').slice(0, 160)}…`);
      continue;
    }

    try {
      await payload.update({
        collection: 'blogs',
        id: doc.id,
        data: { body } as Parameters<typeof payload.update>[0]['data'],
        overrideAccess: true,
      });
      console.log(`  ✓ ${slug}: updated (${placed} embed${placed === 1 ? '' : 's'})`);
      updated += 1;
    } catch (err) {
      failed += 1;
      console.error(`  ! ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n[embeds] Done. updated=${updated} skipped=${skipped} failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('[embeds] Fatal:', err);
  process.exit(1);
});
