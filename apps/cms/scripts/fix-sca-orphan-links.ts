#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: repair the two Lexical links pointing at the deleted orphan page
 * `/software-composition-analysis` (404 in prod — the post-launch redirect row
 * was never applied). Found via the daily broken-links scan (broken_links rows
 * 321/322):
 *
 *   - blogs/cve-fatigue-why-most-container-vulnerabilities-never-get-fixed (id 31):
 *       repoint the "CleanStart's software composition analysis" link to the
 *       live guide `/guide/software-composition-analysis`.
 *   - guides/software-composition-analysis (id 4):
 *       remove the self-referential link (unwrap it, keep the anchor text).
 *
 * Writes via `payload.update` so the published version, stats hook, and
 * Meilisearch re-sync are handled correctly (mirrors strip-guide-inline-faqs.ts).
 * Idempotent: a doc with no matching orphan link is left untouched.
 *
 *   pnpm exec tsx --env-file=.env scripts/fix-sca-orphan-links.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/fix-sca-orphan-links.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const ORPHAN_PATH = '/software-composition-analysis';
const GUIDE_URL = 'https://www.cleanstart.com/guide/software-composition-analysis';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

type LexNode = { type?: string; fields?: { url?: string; linkType?: string }; children?: LexNode[] } & Record<string, unknown>;

const isOrphanLink = (node: LexNode): boolean => {
  if (node.type !== 'link') return false;
  const url = node.fields?.url;
  if (typeof url !== 'string') return false;
  let path = url;
  try {
    path = new URL(url, 'https://www.cleanstart.com').pathname;
  } catch {
    /* keep raw */
  }
  return path.replace(/\/$/, '') === ORPHAN_PATH;
};

/** Walk children arrays. `mode` decides what happens to a matched orphan link. */
const transform = (node: LexNode, mode: 'repoint' | 'unwrap', counter: { n: number }): LexNode => {
  if (!Array.isArray(node.children)) return node;
  const next: LexNode[] = [];
  for (const child of node.children) {
    if (isOrphanLink(child)) {
      counter.n += 1;
      if (mode === 'repoint') {
        next.push({ ...child, fields: { ...child.fields, url: GUIDE_URL } });
      } else {
        // unwrap: drop the link wrapper, keep its (already-processed) children
        const unwrapped = transform(child, mode, counter);
        for (const gc of unwrapped.children ?? []) next.push(gc);
      }
      continue;
    }
    next.push(transform(child, mode, counter));
  }
  return { ...node, children: next };
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`\nMode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE via payload.update'}\n`);

  const targets: { collection: 'blogs' | 'guides'; id: number; mode: 'repoint' | 'unwrap' }[] = [
    { collection: 'blogs', id: 31, mode: 'repoint' },
    { collection: 'guides', id: 4, mode: 'unwrap' },
  ];

  let errors = 0;
  for (const t of targets) {
    try {
      const doc = (await payload.findByID({
        collection: t.collection,
        id: t.id,
        depth: 0,
        overrideAccess: true,
      })) as Record<string, unknown>;
      const body = doc.body as LexNode;
      const root = (body?.root ?? body) as LexNode;
      const counter = { n: 0 };
      const nextRoot = transform(root, t.mode, counter);
      const nextBody = body?.root ? { ...body, root: nextRoot } : nextRoot;

      log(`${t.collection}#${t.id} (${String(doc.slug)}): ${counter.n} orphan link(s) -> ${t.mode}`);
      if (counter.n === 0 || DRY_RUN) continue;

      await payload.update({
        collection: t.collection,
        id: t.id,
        data: { body: nextBody } as Record<string, unknown>,
        overrideAccess: true,
      });
      log(`  updated.`);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console -- script output
      console.error(`  ! ${t.collection}#${t.id}: ${message}`);
    }
  }

  log(`\nDone. errors=${errors}`);
  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
