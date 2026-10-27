#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: fold each advisory's separate Impacted packages and Resolution
 * rich-text boxes into its single `body`, under Heading 2s, then clear the old
 * boxes. The columns stay (a drop needs separate approval). Idempotent: an
 * advisory whose old boxes are already empty is skipped.
 *
 * Dry run by default; `--apply` writes.
 * Local:   pnpm exec tsx --env-file=.env scripts/merge-advisory-sections.ts [--apply]
 * Prod container (env in process, no .env):
 *   /app/node_modules/.bin/tsx scripts/merge-advisory-sections.ts [--apply]
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const APPLY = process.argv.includes('--apply');

type Node = Record<string, unknown>;
type LexicalRoot = { root?: { children?: Node[] } } | null | undefined;

const children = (value: unknown): Node[] => (value as LexicalRoot)?.root?.children ?? [];

const heading = (value: string): Node => ({
  type: 'heading',
  tag: 'h2',
  format: '',
  indent: 0,
  version: 1,
  direction: null,
  children: [{ type: 'text', text: value, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
});

const root = (nodes: Node[]): Node => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: null, children: nodes },
});

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  const res = await payload.find({
    collection: 'advisories',
    limit: 1000,
    depth: 0,
    draft: true,
    overrideAccess: true,
  });

  const paths = new Set<string>();
  for (const doc of res.docs) {
    const impact = children(doc.impact);
    const resolution = children(doc.resolution);
    if (impact.length === 0 && resolution.length === 0) {
      log(`  skip     ${doc.slug}: nothing to merge`);
      continue;
    }
    const merged = [
      heading('Vulnerability'),
      ...children(doc.body),
      ...(impact.length > 0 ? [heading('Impacted packages and versions'), ...impact] : []),
      ...(resolution.length > 0 ? [heading('Resolution'), ...resolution] : []),
    ];
    log(`  ${APPLY ? 'merge   ' : 'would   '} ${doc.slug}: ${merged.length} top-level nodes (${doc._status})`);
    if (!APPLY) continue;
    await payload.update({
      collection: 'advisories',
      id: doc.id,
      data: { body: root(merged), impact: null, resolution: null } as Record<string, unknown>,
      draft: doc._status !== 'published',
      overrideAccess: true,
    });
    paths.add(`/advisories/${doc.slug}`);
  }

  if (APPLY && paths.size > 0) {
    // The publish hook defers its purge on a timer that process.exit would kill.
    const purge = await revalidateWeb(payload, { paths: ['/advisories', ...paths] });
    log(`  purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
  }
  if (!APPLY) log('  dry run: pass --apply to write');
  process.exit(0);
};

run().catch((err: unknown) => {
  // eslint-disable-next-line no-console -- script output
  console.error(err);
  process.exit(1);
});
