#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `jobs.hiringStatus` (open/closed) from the original Webflow export.
 *
 * Webflow has no explicit open/closed field — a role's status is its draft
 * state (`_meta.isDraft` / `_meta.isArchived`): a draft/archived role was a
 * closed role, a live one was open. The local jobs were populated without that
 * status, so every job is `hiringStatus: open`. This restores it (matched by
 * slug) while keeping every job PUBLISHED, so the careers site lists all roles
 * with correct OPEN/CLOSED badges and a working Open/Closed/All filter.
 *
 * Does NOT touch `_status` — jobs stay published (the careers list only shows
 * published rows; we want closed roles visible, not hidden).
 *
 * Idempotent: only writes when the status differs. Re-runnable.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-job-hiring-status.ts
 *
 * PROD note: `payload.update` re-fires the jobs afterChange hooks and creates a
 * version row per job; the closing also stamps `closedAt` (= now, since the
 * real Webflow close date isn't in the export). Run in a quiet window.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

type RawJob = { slug?: string; _meta?: { isDraft?: boolean; isArchived?: boolean } };

const here = dirname(fileURLToPath(import.meta.url));
const RAW_PATH = resolve(here, '../../../migrations/webflow-export/raw/jobs.jsonl');

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const lines = readFileSync(RAW_PATH, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let toOpen = 0;
  let toClosed = 0;
  let unchanged = 0;
  let notFound = 0;

  for (const line of lines) {
    const row = JSON.parse(line) as RawJob;
    if (!row.slug) continue;
    const meta = row._meta ?? {};
    const hiringStatus: 'open' | 'closed' =
      meta.isDraft === true || meta.isArchived === true ? 'closed' : 'open';

    const res = await payload.find({
      collection: 'jobs',
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const job = res.docs[0] as { id: number; hiringStatus?: string | null } | undefined;
    if (!job) {
      notFound += 1;
      continue;
    }
    if (job.hiringStatus === hiringStatus) {
      unchanged += 1;
      continue;
    }

    await payload.update({
      collection: 'jobs',
      id: job.id,
      data: { hiringStatus },
      overrideAccess: true,
    });
    if (hiringStatus === 'closed') toClosed += 1;
    else toOpen += 1;
    payload.logger.info(`✓ ${row.slug} → ${hiringStatus}`);
  }

  payload.logger.info(
    `Backfill done: ${toClosed} → closed, ${toOpen} → open, ${unchanged} unchanged, ${notFound} not in DB.`,
  );
  process.exit(0);
};

try {
  await run();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
