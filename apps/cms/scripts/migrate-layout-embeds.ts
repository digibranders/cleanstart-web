/**
 * Convert flattened Webflow layout embeds (feature grids AND callout boxes:
 * myth-box / what-is-mythos-box) into EmbedNodes that preserve the original
 * markup, so the web renderer + ported CSS lay them back out.
 *
 * Generalises migrate-feature-grid-embeds.ts to also cover callout boxes. The
 * embed's own dark-theme <style> is stripped (it was authored for Webflow's
 * dark site); the light-theme styling is shipped in globals.css instead.
 *
 * Regenerates the body from the Webflow source (deterministic, so safe to
 * re-run). Images are reused from the doc's existing media — paired positionally
 * with the source <img> order — so nothing is duplicated; non-layout images
 * (e.g. a standalone diagram) keep their responsive upload-node treatment.
 *
 * PREREQUISITE: the web frontend must render the `embed` node + ship the embed
 * CSS in prod. Deploy web first, then run this.
 *
 * Run from apps/cms with the prod env loaded (DB via tunnel, R2 = prod):
 *   node --env-file=<prod.env> --import tsx/esm scripts/migrate-layout-embeds.ts --dry-run
 *   node --env-file=<prod.env> --import tsx/esm scripts/migrate-layout-embeds.ts
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

const LAYOUT_CLASS = /class="[^"]*(?:feature-grid|myth-box|what-is-mythos-box)/;
const WF_CDN_RE = /https:\/\/(?:cdn\.prod\.website-files\.com|uploads(?:-ssl)?\.webflow\.com)\/[^\s"<>]+/g;
const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const cleanseUrl = (u: string): string => u.replace(/[.,;]+$/, '');

type LexNode = Record<string, unknown>;
type MediaRef = { id?: number; url: string };

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

/** Extract `<div data-rt-embed-type …>…</div>` blocks via nested-div matching. */
const extractEmbedBlocks = (html: string): { html: string; start: number; end: number }[] => {
  const blocks: { html: string; start: number; end: number }[] = [];
  const openRe = /<div\b[^>]*\bdata-rt-embed-type\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec loop
  while ((m = openRe.exec(html)) !== null) {
    const start = m.index;
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = start;
    let depth = 0;
    let t: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: regex exec loop
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

/** Media refs ({id?,url}) referenced by a body, in document order. */
const collectMediaRefs = (node: unknown, acc: MediaRef[] = []): MediaRef[] => {
  if (Array.isArray(node)) {
    for (const c of node) collectMediaRefs(c, acc);
  } else if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if (n.type === 'upload') {
      const v = n.value as { id?: number; url?: string } | undefined;
      if (v && typeof v === 'object') acc.push({ id: v.id, url: typeof v.url === 'string' ? v.url : '' });
    } else if (n.type === 'embed' && typeof n.rawHtml === 'string') {
      for (const mm of n.rawHtml.matchAll(/<img[^>]+src="([^"]+)"/g)) acc.push({ url: mm[1] });
    }
    for (const c of Object.values(n)) collectMediaRefs(c, acc);
  }
  return acc;
};

const countEmbeds = (node: unknown): number => {
  if (Array.isArray(node)) return node.reduce((a: number, c) => a + countEmbeds(c), 0);
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    return (n.type === 'embed' ? 1 : 0) + Object.values(n).reduce((a: number, c) => a + countEmbeds(c), 0);
  }
  return 0;
};

const readJsonl = async (file: string): Promise<LexNode[]> => {
  const rows: LexNode[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  for await (const line of rl) if (line.trim()) rows.push(JSON.parse(line) as LexNode);
  return rows;
};

const main = async (): Promise<void> => {
  console.log(`[layout-embeds] ${dryRun ? 'DRY RUN — ' : ''}converting feature-grid + callout embeds`);
  const rows = await readJsonl(RAW_BLOGS);
  const payload = await getPayload({ config });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const slug = typeof row.slug === 'string' ? row.slug : null;
    const html =
      (typeof row['main-text'] === 'string' && row['main-text']) ||
      (typeof row['post-body'] === 'string' && row['post-body']) ||
      '';
    if (!slug || !LAYOUT_CLASS.test(html as string)) continue;

    const layoutBlocks = extractEmbedBlocks(html as string).filter((b) => LAYOUT_CLASS.test(b.html));
    if (layoutBlocks.length === 0) continue;

    const found = await payload.find({
      collection: 'blogs',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
      draft: true,
    });
    const doc = found.docs[0] as { id: number | string; body?: unknown } | undefined;
    if (!doc) continue;

    if (countEmbeds(doc.body) >= layoutBlocks.length) {
      console.log(`  ✓ ${slug}: already has ${layoutBlocks.length} embed(s) — skipping`);
      skipped += 1;
      continue;
    }

    // Pair source images (doc order) with the doc's existing media refs.
    const srcs = Array.from((html as string).matchAll(WF_CDN_RE)).map((mm) => cleanseUrl(mm[0]));
    const refs = collectMediaRefs(doc.body);
    const srcToRef = new Map<string, MediaRef>();
    for (let i = 0; i < srcs.length && i < refs.length; i += 1) srcToRef.set(srcs[i], refs[i]);

    // Placeholder each layout embed; build its rawHtml (imgs → R2, <style> stripped).
    let modified = '';
    let cursor = 0;
    const embeds: string[] = [];
    layoutBlocks.forEach((b, k) => {
      modified += (html as string).slice(cursor, b.start);
      modified += `<p>__EMBED_${k}__</p>`;
      cursor = b.end;
      const rawHtml = b.html
        .replace(STYLE_RE, '')
        .replace(WF_CDN_RE, (u) => srcToRef.get(cleanseUrl(u))?.url || u);
      embeds.push(rawHtml);
    });
    modified += (html as string).slice(cursor);

    const body = htmlToLexical(modified, {
      resolveImage: (src) => {
        const ref = srcToRef.get(cleanseUrl(src));
        return ref?.id != null ? { id: ref.id } : null;
      },
    }) as { root: { children: LexNode[] } };

    let placed = 0;
    body.root.children = body.root.children.map((n) => {
      if (n.type !== 'paragraph') return n;
      const kids = (n.children as LexNode[] | undefined) ?? [];
      if (kids.length !== 1 || kids[0]?.type !== 'text') return n;
      const mm = /^__EMBED_(\d+)__$/.exec(String((kids[0] as { text?: unknown }).text ?? ''));
      if (!mm) return n;
      const idx = Number(mm[1]);
      if (embeds[idx] == null) return n;
      placed += 1;
      return embedNode(embeds[idx]);
    });

    if (placed !== embeds.length) console.warn(`  ⚠ ${slug}: placed ${placed}/${embeds.length} embeds`);

    if (dryRun) {
      console.log(`  • WOULD update ${slug}: ${embeds.length} layout embed(s) (${refs.length} media refs)`);
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

  console.log(`\n[layout-embeds] Done. updated=${updated} skipped=${skipped} failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('[layout-embeds] Fatal:', err);
  process.exit(1);
});
