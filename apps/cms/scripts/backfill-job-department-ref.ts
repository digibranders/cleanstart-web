#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill `jobs.departmentRef` (relationship → departments) from the legacy
 * `department` select enum. Run AFTER seed-departments.ts, which creates one
 * department doc per enum value (slug === enum value).
 *
 * Distinct from `backfill-job-department.ts` (prod checklist task #3), which
 * restores the legacy ENUM value from the Webflow export. This one only sets
 * the new RELATIONSHIP from whatever enum value is already stored — run it
 * after that one, so the enum is correct first.
 *
 * For each job: look up the department doc whose `slug` equals the job's
 * `department` enum value, and set `departmentRef`. The legacy enum is left
 * untouched (parallel transition).
 *
 * SAFETY: idempotent. Skips a job whose `departmentRef` already points at the
 * correct department, and skips a job with no `department` value (optional
 * enum). A `department` value with no matching doc is logged as UNMAPPED
 * (never guessed) — re-run seed-departments.ts first. `--dry-run` previews.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/backfill-job-department-ref.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/backfill-job-department-ref.ts
 *
 * PROD note: `payload.update` re-fires the jobs afterChange hooks.
 * Teams/IndexNow are publish-transition-gated (no fire on re-save of a
 * published doc); the effects are a Meilisearch re-sync, a web revalidate,
 * and a version row per updated job. Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const payload = await getPayload({ config });

  const departments = await payload.find({
    collection: 'departments',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  const idBySlug = new Map<string, string | number>();
  for (const d of departments.docs as { id: string | number; slug?: string | null }[]) {
    if (d.slug) idBySlug.set(d.slug, d.id);
  }

  const jobs = await payload.find({
    collection: 'jobs',
    limit: 1000,
    depth: 0,
    draft: true,
    overrideAccess: true,
  });

  let updated = 0;
  let already = 0;
  let unmapped = 0;
  let noValue = 0;

  for (const job of jobs.docs as {
    id: string | number;
    department?: string | null;
    departmentRef?: string | number | { id: string | number } | null;
  }[]) {
    const value = job.department;
    if (!value) {
      noValue += 1;
      continue;
    }

    const targetId = idBySlug.get(value);
    if (targetId == null) {
      unmapped += 1;
      console.warn(`UNMAPPED ${job.id} — no department doc for "${value}" (re-run seed first)`);
      continue;
    }

    const currentRef =
      typeof job.departmentRef === 'object' && job.departmentRef !== null
        ? job.departmentRef.id
        : job.departmentRef;
    if (currentRef === targetId) {
      already += 1;
      continue;
    }

    if (!dryRun) {
      await payload.update({
        collection: 'jobs',
        id: job.id,
        data: { departmentRef: targetId },
        overrideAccess: true,
      });
    }
    updated += 1;
    console.log(`${dryRun ? '[dry-run] ' : ''}set      ${job.id} → ${value}`);
  }

  console.log(
    `\nDone. ${jobs.docs.length} scanned · ${updated} updated · ${already} already-correct · ${noValue} no-department · ${unmapped} unmapped.`,
  );
  process.exit(unmapped > 0 ? 2 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
