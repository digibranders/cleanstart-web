#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: fill in the missing summary / SEO title on every resource that
 * was missing one, drafted from each resource's own PDF (see
 * scripts/attach-cis-hardening-pdf.ts for the CIS Hardening case that
 * started this).
 *
 * Reads a JSON array of { id, summary?, seoTitle? } from /tmp and applies
 * each entry to the matching resource, leaving every other field as it is.
 * A field is only written when the input supplies it, so an entry that
 * omits `summary` (id 11, which already had one) leaves it untouched.
 * Skips an id whose current value already matches, so the script is safe to
 * re-run.
 *
 * Purges each resource's own page plus /resource-center once at the end,
 * since the publish hook's deferred purge never fires in a script that
 * exits right after the writes (see scripts/attach-cis-hardening-pdf.ts).
 *
 * The input file is read from /tmp inside the container; copy it in first.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/backfill-resource-copy.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/backfill-resource-copy.ts
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const INPUT_PATH = '/tmp/resource-copy-backfill.json';

interface Entry {
  id: number;
  summary?: string;
  seoTitle?: string;
}

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const fs = await import('node:fs/promises');
  const entries = JSON.parse(await fs.readFile(INPUT_PATH, 'utf8')) as Entry[];
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'} | ${entries.length} entries\n`);

  const slugs: string[] = [];
  for (const entry of entries) {
    const before = (await payload.findByID({
      collection: 'resources',
      id: entry.id,
      depth: 0,
      draft: true,
      overrideAccess: true,
    })) as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    if (entry.summary != null && before.summary !== entry.summary) data.summary = entry.summary;
    if (entry.seoTitle != null) {
      const seo = (before.seo as Record<string, unknown> | undefined) ?? {};
      if (seo.title !== entry.seoTitle) data.seo = { ...seo, title: entry.seoTitle };
    }

    if (Object.keys(data).length === 0) {
      log(`  skip     id ${entry.id} (${before.slug}): already matches`);
      continue;
    }

    log(
      `  ${DRY_RUN ? 'would update' : 'update  '} id ${entry.id} (${before.slug}): ${Object.keys(data).join(', ')}`,
    );
    if (!DRY_RUN) {
      data._status = 'published';
      await payload.update({
        collection: 'resources',
        id: entry.id,
        data,
        overrideAccess: true,
      });
      slugs.push(before.slug as string);
    }
  }

  if (DRY_RUN || slugs.length === 0) return;

  const paths = ['/resource-center', ...slugs.map((s) => `/resources/${s}`)];
  const purge = await revalidateWeb(payload, { paths });
  log(`\n  purge    ${slugs.length} page(s) + listing: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
