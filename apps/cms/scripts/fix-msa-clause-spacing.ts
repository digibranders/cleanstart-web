#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: clean up Word-paste artifacts in the Master Service and License
 * Agreement body.
 *
 * - Clause numbers from 1.10 on (and 5.2.x, 10.x, 11.x) are followed by runs
 *   of non-breaking spaces, so their text starts far to the right of 1.1 to
 *   1.9. Every run of two or more spaces becomes one space.
 * - The i./ii. sub-items under 11.6 are indented with leading spaces. The
 *   leading whitespace is removed.
 * - 11.6 reads "Governing Law and Dispute Resolution. 1.1. This Agreement is
 *   governed by:". The stray "1.1." is removed.
 * - "5.2. Customer Obligations." is an h3 while every sibling clause is a
 *   paragraph. It becomes a paragraph, keeping its bold title like 5.1.
 *
 * Aborts if the document changed since it was reviewed, or has an unpublished
 * draft, so a newer edit is never overwritten.
 *
 * The publish hook defers its web purge on an unref'd timer that dies with
 * process.exit, so the purge is sent here directly after the update.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/fix-msa-clause-spacing.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/fix-msa-clause-spacing.ts
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const SLUG = 'master-service-and-license-agreement';
const REVIEWED_UPDATED_AT = '2026-10-16T08:47:26.129Z';
const STRAY_NUMBER = { from: ' 1.1. This Agreement is governed by:', to: ' This Agreement is governed by:' };
const HEADING_TEXT = '5.2. Customer Obligations.';

const DRY_RUN = process.argv.includes('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

interface LexNode {
  type: string;
  text?: string;
  tag?: string;
  children?: LexNode[];
  [key: string]: unknown;
}

interface Doc {
  id: number | string;
  _status?: string;
  updatedAt?: string;
  body?: { root: LexNode };
}

const show = (s: string): string => JSON.stringify(s.slice(0, 70));

const plainText = (n: LexNode): string =>
  (n.text ?? '') + (n.children ?? []).map(plainText).join('');

const cleanBody = (root: LexNode): number => {
  let changes = 0;
  let strayFixed = false;
  let headingFixed = false;

  const setText = (t: LexNode, next: string): void => {
    if (next === t.text) return;
    log(`  text  ${show(t.text ?? '')}\n     -> ${show(next)}`);
    t.text = next;
    changes++;
  };

  const blocks = root.children ?? [];
  blocks.forEach((block, i) => {
    if (block.type === 'heading' && plainText(block).trim() === HEADING_TEXT) {
      log(`  block ${i}: h3 "${HEADING_TEXT}" -> paragraph`);
      const { tag: _tag, ...rest } = block;
      blocks[i] = { ...rest, type: 'paragraph', textFormat: 0, textStyle: '' };
      headingFixed = true;
      changes++;
    }
  });

  const walk = (n: LexNode, firstInBlock: boolean): void => {
    if (n.type === 'text' && typeof n.text === 'string') {
      let next = n.text === STRAY_NUMBER.from ? STRAY_NUMBER.to : n.text;
      if (next !== n.text) strayFixed = true;
      next = next.replace(/[  ]{2,}/g, ' ');
      if (firstInBlock) next = next.replace(/^[  ]+/, '');
      setText(n, next);
      return;
    }
    (n.children ?? []).forEach((c, idx) => walk(c, firstInBlock && idx === 0));
  };
  for (const block of blocks) walk(block, true);

  if (!strayFixed) throw new Error(`Stray number text not found: ${show(STRAY_NUMBER.from)}`);
  if (!headingFixed) throw new Error(`Heading not found: ${HEADING_TEXT}`);
  return changes;
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}\n`);

  const find = async (draft: boolean): Promise<Doc | undefined> =>
    (
      await payload.find({
        collection: 'legalDocuments',
        where: { slug: { equals: SLUG } },
        limit: 1,
        depth: 0,
        draft,
        overrideAccess: true,
      })
    ).docs[0] as Doc | undefined;

  const published = await find(false);
  const latest = await find(true);
  if (!published?.body || !latest) throw new Error(`Legal document ${SLUG} not found`);
  log(`  doc ${published.id} (${published._status}, updated ${published.updatedAt})`);
  if (published.updatedAt !== REVIEWED_UPDATED_AT) {
    throw new Error(`Document changed since review (${published.updatedAt}); re-review before running`);
  }
  if (latest.updatedAt !== published.updatedAt || latest._status !== 'published') {
    throw new Error(`Document has an unpublished draft (${latest._status}, ${latest.updatedAt}); not overwriting it`);
  }

  const body = structuredClone(published.body);
  const changes = cleanBody(body.root);
  log(`\n  ${changes} changes`);
  if (DRY_RUN) return;

  await payload.update({
    collection: 'legalDocuments',
    id: published.id,
    data: { body, _status: 'published' } as Record<string, unknown>,
    overrideAccess: true,
  });
  log(`  updated  doc ${published.id}, published`);

  const purge = await revalidateWeb(payload, { paths: [`/legal/${SLUG}`, '/legal'] });
  log(`  purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
