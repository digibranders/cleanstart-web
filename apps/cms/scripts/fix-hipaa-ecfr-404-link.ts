#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: remove the single dead external link in the Knowledge Base article
 * `hipaa-compliance-mapping` (knowledge_base id 189). The Lexical body links the
 * text "HIPAA Security Rule (45 CFR Part 164 Subpart C)" to
 *   https://www.ecfr.gov/current/title-45/subtitle-A/subpart-C/part-164
 * which 404s on eCFR (malformed path — a subpart cannot sit directly under a
 * subtitle; the valid node is `subchapter-C`, linked elsewhere in the same
 * article and still 200). Unwrap the link, keeping its anchor text as plain
 * prose. Only this exact URL is touched; the other two ecfr.gov links are left
 * intact.
 *
 * Writes via `payload.update` (published version + stats hook + Meili re-sync),
 * mirroring the other content one-shots. Idempotent.
 *
 *   pnpm exec tsx --env-file=.env scripts/fix-hipaa-ecfr-404-link.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/fix-hipaa-ecfr-404-link.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const DEAD_URL = 'https://www.ecfr.gov/current/title-45/subtitle-A/subpart-C/part-164';
const DOC_ID = 189;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

type LexNode = { type?: string; fields?: { url?: string }; children?: LexNode[] } & Record<string, unknown>;

const isDeadLink = (node: LexNode): boolean =>
  node.type === 'link' && node.fields?.url === DEAD_URL;

/** Walk children arrays; replace a matched dead link with its children (unwrap). */
const unwrap = (node: LexNode, counter: { n: number }): LexNode => {
  if (!Array.isArray(node.children)) return node;
  const next: LexNode[] = [];
  for (const child of node.children) {
    if (isDeadLink(child)) {
      counter.n += 1;
      const inner = unwrap(child, counter);
      for (const gc of inner.children ?? []) next.push(gc);
      continue;
    }
    next.push(unwrap(child, counter));
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
  const nextRoot = unwrap(root, counter);
  const nextBody = body?.root ? { ...body, root: nextRoot } : nextRoot;

  log(`knowledge_base#${DOC_ID} (${String(doc.slug)}): ${counter.n} dead ecfr link(s) removed`);
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
