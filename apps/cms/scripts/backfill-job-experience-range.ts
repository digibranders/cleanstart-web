#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `jobs.experienceRange` from the original Webflow export.
 *
 * The Webflow→Payload import bucketed the free-text `experience` year range
 * (e.g. "3-10 years") into the `experienceLevel` enum and discarded the
 * original string. This restores the human-readable range — matched by slug —
 * so the careers site can show "3-10 Years" like the old Webflow site.
 *
 * Idempotent: only writes when the normalized range differs from what's stored.
 * Re-runnable.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-job-experience-range.ts
 *
 * PROD note: `payload.update` re-fires the jobs afterChange hooks (search sync,
 * webhooks, IndexNow) and creates a version row per job. Run during a quiet
 * window; those side effects are no-ops locally when the integrations are unset.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { normalizeExperienceRange } from '../src/payload/lib/webflow-import/job-normalize.ts';

type RawJob = { slug?: string; experience?: unknown };

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
  let noRange = 0;
  let notFound = 0;

  for (const line of lines) {
    const row = JSON.parse(line) as RawJob;
    if (!row.slug) continue;
    const range = normalizeExperienceRange(row.experience);
    if (!range) {
      noRange += 1;
      continue;
    }

    const res = await payload.find({
      collection: 'jobs',
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const job = res.docs[0] as { id: number; experienceRange?: string | null } | undefined;
    if (!job) {
      notFound += 1;
      continue;
    }
    if ((job.experienceRange ?? '') === range) {
      unchanged += 1;
      continue;
    }

    await payload.update({
      collection: 'jobs',
      id: job.id,
      data: { experienceRange: range },
      overrideAccess: true,
    });
    updated += 1;
    payload.logger.info(`✓ ${row.slug} → ${range}`);
  }

  payload.logger.info(
    `Backfill done: ${updated} updated, ${unchanged} already-set, ${noRange} no-range in export, ${notFound} not in DB.`,
  );
  process.exit(0);
};

try {
  await run();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
