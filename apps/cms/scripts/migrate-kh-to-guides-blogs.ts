#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: move 52 Knowledge Hub articles to Guides (46) and Blogs (6).
 *
 * Mapping, SEO title/description and blog categories live in
 * scripts/data/kh-migration-map.json (built from the final content sheet).
 *
 * Three stages, run in this order, each idempotent:
 *   create     Publish a guide/blog copy of each article. Body links to another
 *              migrated article are rewritten to its new URL. Skips a slug that
 *              already exists in the target collection.
 *   redirects  Add a 301 from /knowledge-hub/<old> to the new URL. Skips a row
 *              whose `from` already exists.
 *   retire     Unpublish the old Knowledge Hub copy so it leaves the sitemap
 *              and search. Run only once the redirect for that row exists.
 *
 * Publish webhooks (Teams cards) are suppressed. The publish hook defers its
 * web purge on an unref'd timer that process.exit kills, so every stage sends
 * the purge itself after the writes have committed.
 *
 * In the prod container (env is in the process, there is no .env; copy the
 * map to scripts/data/ first):
 *   /app/node_modules/.bin/tsx scripts/migrate-kh-to-guides-blogs.ts create --dry-run
 *   /app/node_modules/.bin/tsx scripts/migrate-kh-to-guides-blogs.ts create
 * `--skip=<oldSlug>,...` leaves rows out of a stage.
 */
import { readFileSync } from 'node:fs';

import { getPayload } from 'payload';
import type { Payload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

type TargetCollection = 'guides' | 'blogs';
type Stage = 'create' | 'redirects' | 'retire';

interface MapRow {
  oldSlug: string;
  coll: TargetCollection;
  newSlug: string;
  seoTitle: string;
  seoDescription: string;
  category: number | null;
}

interface LexicalNode {
  type?: string;
  url?: string;
  fields?: { url?: string } & Record<string, unknown>;
  children?: LexicalNode[];
}

const AUTHOR_ID = 7; // "CleanStart Security", the byline on the existing guides and blogs
const PREFIX: Record<TargetCollection, string> = { guides: '/guide', blogs: '/blogs' };
const KH_LINK = /^(?:https?:\/\/(?:www\.)?cleanstart\.com)?\/knowledge-hub\/([a-z0-9-]+)(#.*)?$/;

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const loadMap = (): MapRow[] =>
  JSON.parse(readFileSync(new URL('./data/kh-migration-map.json', import.meta.url), 'utf8')) as MapRow[];

const newPath = (row: MapRow): string => `${PREFIX[row.coll]}/${row.newSlug}`;

const rewriteLinks = (node: LexicalNode, targets: Map<string, string>): number => {
  let changed = 0;
  const raw = node.fields?.url ?? node.url;
  if (typeof raw === 'string') {
    const m = KH_LINK.exec(raw);
    const target = m?.[1] ? targets.get(m[1]) : undefined;
    if (m && target) {
      const next = `${target}${m[2] ?? ''}`;
      if (node.fields?.url !== undefined) node.fields.url = next;
      else node.url = next;
      changed += 1;
    }
  }
  for (const child of node.children ?? []) changed += rewriteLinks(child, targets);
  return changed;
};

const findKb = async (payload: Payload, slug: string): Promise<Record<string, unknown> | undefined> => {
  const res = await payload.find({
    collection: 'knowledgeBase',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    draft: false,
    overrideAccess: true,
  });
  return res.docs[0] as unknown as Record<string, unknown> | undefined;
};

const exists = async (payload: Payload, collection: string, field: string, value: string): Promise<boolean> => {
  const res = await payload.find({
    collection: collection as 'guides',
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  return res.docs.length > 0;
};

const stripIds = <T extends Record<string, unknown>>(items: T[] | null | undefined): Omit<T, 'id'>[] =>
  (items ?? []).map(({ id: _id, ...rest }) => rest);

const create = async (payload: Payload, rows: MapRow[], dryRun: boolean): Promise<string[]> => {
  const targets = new Map(rows.map((r) => [r.oldSlug, newPath(r)]));
  const touched: string[] = [];
  for (const row of rows) {
    const kb = await findKb(payload, row.oldSlug);
    if (!kb) throw new Error(`Knowledge Hub article not found: ${row.oldSlug}`);
    if (kb._status !== 'published') throw new Error(`Knowledge Hub article is not published: ${row.oldSlug}`);
    if (await exists(payload, row.coll, 'slug', row.newSlug)) {
      log(`skip     ${row.coll}/${row.newSlug} already exists`);
      continue;
    }
    const body = JSON.parse(JSON.stringify(kb.body ?? null)) as { root?: LexicalNode } | null;
    const rewritten = body?.root ? rewriteLinks(body.root, targets) : 0;
    const data: Record<string, unknown> = {
      title: kb.title,
      slug: row.newSlug,
      abstract: row.seoDescription,
      body,
      faqs: stripIds(kb.faqs as Record<string, unknown>[] | undefined),
      authors: [AUTHOR_ID],
      lastReviewedAt: kb.lastReviewedAt ?? undefined,
      tocDepth: kb.tocDepth ?? 'h2',
      publishedAt: kb.publishedAt ?? undefined,
      seo: { title: row.seoTitle, description: row.seoDescription, indexable: 'index' },
      _status: 'published',
    };
    if (row.coll === 'blogs') {
      if (row.category == null) throw new Error(`Blog row has no category: ${row.oldSlug}`);
      data.categories = row.category;
    }
    log(`${dryRun ? 'would    ' : 'create   '} ${row.coll}/${row.newSlug}  (${rewritten} links rewritten)`);
    if (dryRun) continue;
    const doc = (await payload.create({
      collection: row.coll,
      data: data as never,
      draft: false,
      overrideAccess: true,
      context: { skipPublishWebhooks: true },
    })) as unknown as { id: number | string; slug: string; _status: string };
    if (doc.slug !== row.newSlug || doc._status !== 'published') {
      throw new Error(`Created ${row.coll} doc has slug ${doc.slug} / status ${doc._status}, expected ${row.newSlug} / published`);
    }
    touched.push(newPath(row));
  }
  return touched;
};

const redirects = async (payload: Payload, rows: MapRow[], dryRun: boolean): Promise<string[]> => {
  const touched: string[] = [];
  for (const row of rows) {
    const from = `/knowledge-hub/${row.oldSlug}`;
    const to = newPath(row);
    if (!(await exists(payload, row.coll, 'slug', row.newSlug))) {
      throw new Error(`Refusing to redirect ${from}: ${to} does not exist yet`);
    }
    if (await exists(payload, 'redirects', 'from', from)) {
      log(`skip     redirect ${from} already exists`);
      continue;
    }
    log(`${dryRun ? 'would    ' : 'redirect '} ${from} -> ${to}`);
    if (dryRun) continue;
    await payload.create({
      collection: 'redirects',
      data: { from, to, status: '301', source: 'manual', notes: 'Knowledge Hub migration to guides and blogs, Nov 2026' },
      overrideAccess: true,
    });
    touched.push(from);
  }
  return touched;
};

const retire = async (payload: Payload, rows: MapRow[], dryRun: boolean): Promise<string[]> => {
  const touched: string[] = [];
  for (const row of rows) {
    const from = `/knowledge-hub/${row.oldSlug}`;
    if (!(await exists(payload, 'redirects', 'from', from))) {
      throw new Error(`Refusing to unpublish ${row.oldSlug}: no redirect row for ${from}`);
    }
    const kb = await findKb(payload, row.oldSlug);
    if (!kb || kb._status !== 'published') {
      log(`skip     ${row.oldSlug} already unpublished`);
      continue;
    }
    log(`${dryRun ? 'would    ' : 'retire   '} knowledgeBase/${row.oldSlug}`);
    if (dryRun) continue;
    await payload.update({
      collection: 'knowledgeBase',
      id: kb.id as number,
      data: { _status: 'draft' },
      overrideAccess: true,
      context: { skipPublishWebhooks: true },
    });
    touched.push(from);
  }
  return touched;
};

const run = async (): Promise<void> => {
  const stage = process.argv[2] as Stage | undefined;
  if (stage !== 'create' && stage !== 'redirects' && stage !== 'retire') {
    throw new Error('Usage: migrate-kh-to-guides-blogs.ts <create|redirects|retire> [--dry-run]');
  }
  const dryRun = process.argv.includes('--dry-run');
  const skip = new Set(
    process.argv.filter((a) => a.startsWith('--skip=')).flatMap((a) => a.slice(7).split(',')),
  );
  const rows = loadMap().filter((r) => !skip.has(r.oldSlug));
  const payload = await getPayload({ config: payloadConfig });

  const touched = await (stage === 'create' ? create : stage === 'redirects' ? redirects : retire)(
    payload,
    rows,
    dryRun,
  );
  log(`${stage}: ${touched.length} changed${dryRun ? ' (dry run, nothing written)' : ''}`);
  if (dryRun || touched.length === 0) return;

  const paths = [
    ...touched,
    ...(stage === 'create' ? ['/guide', '/blogs'] : ['/knowledge-hub']),
    '/sitemap.xml',
  ];
  const purge = await revalidateWeb(payload, { paths });
  log(`purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err);
    process.exit(1);
  });
