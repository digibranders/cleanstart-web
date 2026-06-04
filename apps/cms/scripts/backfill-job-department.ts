#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `jobs.department` from the original Webflow export.
 *
 * The Webflow→Payload import read department from a non-existent `department`
 * field (the value actually lives in `job-summary`, e.g. "Sales",
 * "Engineering", "Human Resource"), so every job ended up with a null
 * department — the careers card shows no department pill and the POSITION
 * filter has no options. This restores it, mapping each raw value to the
 * department enum via `normalizeDepartment`, matched by slug.
 *
 * Idempotent: only writes when the mapped department differs from what's
 * stored. Re-runnable.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-job-department.ts
 *
 * PROD note: `payload.update` re-fires the jobs afterChange hooks (search sync,
 * IndexNow, webhooks) and creates a version row per job. Run in a quiet window.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { normalizeDepartment } from '../src/payload/lib/webflow-import/job-normalize.ts';

type RawJob = { slug?: string; 'job-summary'?: unknown };

const here = dirname(fileURLToPath(import.meta.url));
const RAW_PATH = resolve(here, '../../../migrations/webflow-export/raw/jobs.jsonl');

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const lines = readFileSync(RAW_PATH, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let updated = 0;
  let unchanged = 0;
  let unmapped = 0;
  let notFound = 0;

  for (const line of lines) {
    const row = JSON.parse(line) as RawJob;
    if (!row.slug) continue;
    const department = normalizeDepartment(row['job-summary']);
    if (!department) {
      unmapped += 1;
      payload.logger.warn(`⚠ ${row.slug}: unmapped department "${String(row['job-summary'])}"`);
      continue;
    }

    const res = await payload.find({
      collection: 'jobs',
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const job = res.docs[0] as { id: number; department?: string | null } | undefined;
    if (!job) {
      notFound += 1;
      continue;
    }
    if ((job.department ?? '') === department) {
      unchanged += 1;
      continue;
    }

    await payload.update({
      collection: 'jobs',
      id: job.id,
      data: { department },
      overrideAccess: true,
    });
    updated += 1;
    payload.logger.info(`✓ ${row.slug} → ${department}`);
  }

  payload.logger.info(
    `Backfill done: ${updated} updated, ${unchanged} already-set, ${unmapped} unmapped (need a map entry), ${notFound} not in DB.`,
  );
  process.exit(0);
};

try {
  await run();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
