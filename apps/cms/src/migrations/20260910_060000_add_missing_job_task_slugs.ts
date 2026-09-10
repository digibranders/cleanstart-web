import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the five task slugs that were registered in `payload.config.ts` without
 * a matching migration, so `enum_payload_jobs_task_slug` never learned them.
 *
 * Every attempt to queue one failed the INSERT into `payload_jobs` with
 * `invalid input value for enum enum_payload_jobs_task_slug`. Payload's
 * `scheduleQueueable` catches that and reports the task as `errored`, and
 * `defaultAfterSchedule` still advances `lastScheduledRun` in the job-stats
 * global — so the scheduler looked healthy while these five had never run once.
 *
 * Two of them are GDPR retention jobs (consent-log 24-month, deal-registration
 * PII 365-day), so this is a compliance fix, not only a dashboard one.
 *
 * `ADD VALUE` cannot run inside a transaction on Postgres < 12; on 16 it can,
 * provided the new label is not used in the same transaction. This migration
 * only adds labels, so it is safe. `IF NOT EXISTS` keeps it idempotent and
 * lets it no-op on a database built from a later baseline.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'purgeConsentLog';
    ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'retryDealSync';
    ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'purgeDealRegistrations';
    ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'refreshContentInsights';
    ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'refreshCrux';`)
}

export async function down(): Promise<void> {
  // Postgres cannot remove a value from an enum type. The five labels are left
  // in place; unused labels are harmless, and dropping the tasks is a
  // code-only change.
}
