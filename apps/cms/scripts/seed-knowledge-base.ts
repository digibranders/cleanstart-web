/**
 * Seed for the Knowledge Hub — categories + articles.
 *
 * Populates `knowledgeCategories` (8 de-numbered Academy sections + their
 * subcategories, plus the 4 legacy groups pinned on top via `displayOrder`)
 * and `knowledgeBase` (the 8 legacy articles + 245 Academy articles), converting
 * each HTML body to Lexical via the shared webflow-import helper.
 *
 * Sources:
 *   - scripts/data/academy-kb.json          (245 extracted Academy articles)
 *   - apps/web/.../kh-articles.data.ts       (7 legacy Block[] articles)
 *   - scripts/data/kb-legacy-articles.ts     (VEX HTML + legacy groups)
 *   - scripts/data/kb-taxonomy.ts            (section/subcategory labels + order)
 *
 * SAFETY: a `knowledgeBase` doc / `knowledgeCategories` doc whose `slug` already
 * exists is **skipped** by default, so re-running never clobbers edits made in
 * the admin. `--force` overwrites; `--dry-run` reports the plan without writing.
 *
 * The collection tables must already exist (Payload push locally; the
 * displayOrder migration runs via CI on deploy). Publishing 253 docs fires the
 * search-sync / Teams / IndexNow afterChange hooks per doc — run in a quiet
 * window. Idempotent.
 *
 * Run (inside apps/cms):
 *   pnpm exec tsx --env-file=.env scripts/seed-knowledge-base.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/seed-knowledge-base.ts
 *   pnpm exec tsx --env-file=.env scripts/seed-knowledge-base.ts --force
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type Payload, getPayload } from 'payload';

import { GENERATED_ARTICLES } from './data/kb-generated-articles.ts';
import config from '../src/payload.config.ts';
import { htmlToLexical } from '../src/payload/lib/webflow-import/html-to-lexical';
import { cleanAcademyHtml } from './data/clean-academy-html.ts';
import { CATEGORY_TO_GROUP_SLUG, LEGACY_GROUPS, VEX_HTML } from './data/kb-legacy-articles.ts';
import { SECTION_NAMES, SECTION_ORDER, humanizeLabel } from './data/kb-taxonomy.ts';
import { videoUrlForPath } from './data/kb-videos.ts';

interface ManifestArticle {
  slug: string;
  path: string;
  sectionNum: string;
  section: string;
  subcategory: string;
  title: string;
  navName: string;
  bodyHtml: string;
  tableCount: number;
  codeCount: number;
  flags: string[];
}

const VEX_META = {
  slug: 'vex-documents',
  title: 'How to Use VEX Documents to Suppress Non-Exploitable CVEs in Your Pipeline',
  lead: 'CleanStart addresses several critical challenges that plague traditional container security approaches.',
  category: 'Emerging Standards',
};

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type LegacyBlock =
  | { type: 'heading'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string };

/** Convert the legacy web `Block[]` shape to HTML for the shared converter. */
const blocksToHtml = (blocks: readonly LegacyBlock[]): string =>
  blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `<h2>${escapeHtml(b.text)}</h2>`;
        case 'p':
          return `<p>${escapeHtml(b.text)}</p>`;
        case 'ul':
          return `<ul>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
        case 'ol':
          return `<ol>${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`;
        case 'code':
          return `<pre data-lang="text">${escapeHtml(b.text)}</pre>`;
        default:
          return '';
      }
    })
    .join('\n');

/** First paragraph text, stripped + truncated, for the SEO abstract. */
const deriveAbstract = (html: string): string | undefined => {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) return undefined;
  const text = match[1]
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length === 0) return undefined;
  return text.length <= 160 ? text : `${text.slice(0, 157).trimEnd()}…`;
};

const counters = {
  catCreated: 0,
  catUpdated: 0,
  catSkipped: 0,
  artCreated: 0,
  artUpdated: 0,
  artSkipped: 0,
};

/** Upsert a category by slug; returns its id (or -1 on a dry-run create). */
async function upsertCategory(
  payload: Payload,
  data: { name: string; slug: string; displayOrder: number; parent?: number },
): Promise<number> {
  const existing = await payload.find({
    collection: 'knowledgeCategories',
    where: { slug: { equals: data.slug } },
    limit: 1,
    depth: 0,
  });
  const payloadData = { ...data, _status: 'published' as const };
  if (existing.docs[0]) {
    const id = existing.docs[0].id;
    if (force && !dryRun) {
      await payload.update({
        collection: 'knowledgeCategories',
        id,
        data: payloadData,
        overrideAccess: true,
      });
      counters.catUpdated += 1;
    } else {
      counters.catSkipped += 1;
    }
    return id;
  }
  counters.catCreated += 1;
  if (dryRun) return -1;
  const created = await payload.create({
    collection: 'knowledgeCategories',
    data: payloadData,
    overrideAccess: true,
  });
  return created.id;
}

/** Upsert a knowledgeBase article by slug. */
async function upsertArticle(
  payload: Payload,
  data: {
    title: string;
    slug: string;
    abstract?: string;
    category: number;
    body: ReturnType<typeof htmlToLexical>;
    videoUrl?: string;
  },
): Promise<void> {
  const existing = await payload.find({
    collection: 'knowledgeBase',
    where: { slug: { equals: data.slug } },
    limit: 1,
    depth: 0,
  });
  const payloadData = { ...data, _status: 'published' as const };
  if (existing.docs[0]) {
    if (!force) {
      counters.artSkipped += 1;
      return;
    }
    if (!dryRun) {
      await payload.update({
        collection: 'knowledgeBase',
        id: existing.docs[0].id,
        data: payloadData,
        overrideAccess: true,
      });
    }
    counters.artUpdated += 1;
    return;
  }
  counters.artCreated += 1;
  if (!dryRun) {
    await payload.create({ collection: 'knowledgeBase', data: payloadData, overrideAccess: true });
  }
}

async function run(): Promise<void> {
  const payload = await getPayload({ config });
  const manifest: ManifestArticle[] = JSON.parse(
    readFileSync(resolve(import.meta.dirname, 'data/academy-kb.json'), 'utf8'),
  );

  // ---- Categories -------------------------------------------------------
  const groupId = new Map<string, number>(); // legacy group slug -> id
  for (const g of LEGACY_GROUPS) {
    groupId.set(
      g.slug,
      await upsertCategory(payload, { name: g.name, slug: g.slug, displayOrder: g.displayOrder }),
    );
  }

  const sectionId = new Map<string, number>(); // section token -> id
  const subcatId = new Map<string, number>(); // `${section}/${subcategory}` -> id
  const seenSections = new Set<string>();
  const subcatOrder = new Map<string, number>(); // per-section running order

  for (const a of manifest) {
    if (!seenSections.has(a.section)) {
      seenSections.add(a.section);
      sectionId.set(
        a.section,
        await upsertCategory(payload, {
          name: SECTION_NAMES[a.section] ?? humanizeLabel(a.section),
          slug: a.section,
          displayOrder: SECTION_ORDER[a.section] ?? 90,
        }),
      );
    }
    const subKey = `${a.section}/${a.subcategory}`;
    if (!subcatId.has(subKey)) {
      const order = (subcatOrder.get(a.section) ?? 0) + 1;
      subcatOrder.set(a.section, order);
      subcatId.set(
        subKey,
        await upsertCategory(payload, {
          name: humanizeLabel(a.subcategory),
          slug: `${a.section}-${a.subcategory}`,
          displayOrder: order,
          parent: sectionId.get(a.section),
        }),
      );
    }
  }
  payload.logger.info(
    `categories: ${counters.catCreated} created, ${counters.catUpdated} updated, ${counters.catSkipped} skipped`,
  );

  // ---- Legacy articles (pinned on top) ----------------------------------
  const usedSlugs = new Set<string>();

  // VEX (bespoke React body → transcribed HTML).
  {
    const groupSlug = CATEGORY_TO_GROUP_SLUG[VEX_META.category.toLowerCase()];
    const catId = groupId.get(groupSlug);
    if (catId != null) {
      usedSlugs.add(VEX_META.slug);
      await upsertArticle(payload, {
        title: VEX_META.title,
        slug: VEX_META.slug,
        abstract: VEX_META.lead.slice(0, 160),
        category: catId,
        body: htmlToLexical(VEX_HTML),
      });
    }
  }

  // The 7 generated Block[] articles.
  for (const article of Object.values(GENERATED_ARTICLES) as Array<{
    slug: string;
    title: string;
    category: string;
    lead: string;
    blocks: LegacyBlock[];
  }>) {
    const groupSlug = CATEGORY_TO_GROUP_SLUG[article.category.toLowerCase()];
    const catId = groupSlug ? groupId.get(groupSlug) : undefined;
    if (catId == null) {
      payload.logger.warn(
        `legacy article ${article.slug}: no group for category "${article.category}" — skipped`,
      );
      continue;
    }
    usedSlugs.add(article.slug);
    await upsertArticle(payload, {
      title: article.title,
      slug: article.slug,
      abstract:
        article.lead.length <= 160 ? article.lead : `${article.lead.slice(0, 157).trimEnd()}…`,
      category: catId,
      body: htmlToLexical(blocksToHtml(article.blocks)),
    });
  }

  // ---- Academy articles -------------------------------------------------
  let collisions = 0;
  for (const a of manifest) {
    const catId = subcatId.get(`${a.section}/${a.subcategory}`);
    if (catId == null) {
      payload.logger.warn(`academy article ${a.path}: no subcategory id — skipped`);
      continue;
    }
    let slug = a.slug;
    if (usedSlugs.has(slug)) {
      slug = `${a.section}-${a.slug}`;
      collisions += 1;
      payload.logger.info(`slug collision: ${a.slug} -> ${slug}`);
    }
    usedSlugs.add(slug);
    const cleanedHtml = cleanAcademyHtml(a.bodyHtml);
    await upsertArticle(payload, {
      title: a.title,
      slug,
      abstract: deriveAbstract(cleanedHtml),
      category: catId,
      body: htmlToLexical(cleanedHtml),
      videoUrl: videoUrlForPath(a.path),
    });
    const done = counters.artCreated + counters.artUpdated + counters.artSkipped;
    if (done % 50 === 0) payload.logger.info(`articles processed: ${done}`);
  }

  payload.logger.info(
    `knowledge-base seed ${dryRun ? '(dry-run) ' : ''}complete — ` +
      `categories: ${counters.catCreated}c/${counters.catUpdated}u/${counters.catSkipped}s · ` +
      `articles: ${counters.artCreated}c/${counters.artUpdated}u/${counters.artSkipped}s · ` +
      `${collisions} slug collisions`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
