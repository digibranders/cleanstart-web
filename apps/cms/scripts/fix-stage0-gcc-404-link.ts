#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: remove the dead external reference in the Knowledge Base article
 * `stage0-compiler-bootstrap` (knowledgeBase id 81). The body's sources
 * paragraph links to
 *   https://gcc.gnu.org/wiki/ReproducibleBuilds
 * which is a soft-404 — the GCC wiki returns HTTP 200 with a "This page does
 * not exist yet" body (verified in a real browser). The other two references
 * in the same sentence (reproducible-builds.org, slsa.dev) are live and kept.
 *
 * The dead link's anchor text is the raw URL, and it sits in a list
 * ("...SLSA Framework: <slsa>, and GCC Reproducible Build Options: <gcc>."),
 * so a bare unwrap would leave a naked dead URL in prose. Instead this removes
 * the link node AND its preceding connective label text node, yielding
 * "...SLSA Framework: https://slsa.dev." with the trailing period intact.
 *
 * Writes via `payload.update`. Idempotent (no-op if the link is already gone).
 *
 *   pnpm exec tsx --env-file=.env scripts/fix-stage0-gcc-404-link.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/fix-stage0-gcc-404-link.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const DEAD_URL = 'https://gcc.gnu.org/wiki/ReproducibleBuilds';
const LABEL_TEXT = ', and GCC Reproducible Build Options: ';
const DOC_ID = 81;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

type LexNode = {
  type?: string;
  text?: string;
  fields?: { url?: string };
  children?: LexNode[];
} & Record<string, unknown>;

const isDeadLink = (node: LexNode): boolean =>
  node.type === 'link' && node.fields?.url === DEAD_URL;

/** Walk children; drop the dead link plus its immediately-preceding label text. */
const strip = (node: LexNode, counter: { n: number }): LexNode => {
  if (!Array.isArray(node.children)) return node;
  const next: LexNode[] = [];
  for (const child of node.children) {
    if (isDeadLink(child)) {
      counter.n += 1;
      const prev = next[next.length - 1];
      if (prev && prev.type === 'text' && prev.text === LABEL_TEXT) {
        next.pop();
      }
      continue; // drop the dead link node itself
    }
    next.push(strip(child, counter));
  }
  return { ...node, children: next };
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`\nMode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE via payload.update'}\n`);

  const doc = (await payload.findByID({
    collection: 'knowledgeBase',
    id: DOC_ID,
    depth: 0,
    overrideAccess: true,
  })) as Record<string, unknown>;

  const body = doc.body as LexNode;
  const root = (body?.root ?? body) as LexNode;
  const counter = { n: 0 };
  const nextRoot = strip(root, counter);
  const nextBody = body?.root ? { ...body, root: nextRoot } : nextRoot;

  log(`knowledgeBase#${DOC_ID} (${String(doc.slug)}): ${counter.n} dead gcc link(s) removed`);
  if (counter.n === 0 || DRY_RUN) {
    process.exit(0);
  }

  await payload.update({
    collection: 'knowledgeBase',
    id: DOC_ID,
    data: { body: nextBody } as Record<string, unknown>,
    overrideAccess: true,
  });
  log('  updated.');
  process.exit(0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
