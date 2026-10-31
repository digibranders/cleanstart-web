import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the five task slugs that `20260910_060000_add_missing_job_task_slugs`
 * put on `enum_payload_jobs_task_slug` but not on `enum_payload_jobs_log_task_slug`.
 * Payload generates a second enum for `payload_jobs_log.task_slug`, and that one
 * was missed.
 *
 * After a task runs, Payload INSERTs a `payload_jobs_log` row. With the label
 * missing, Postgres rejects it with `invalid input value for enum
 * enum_payload_jobs_log_task_slug`, so a task that succeeded is recorded as
 * failed and its job is retried (`refreshCrux` reached `totalTried: 43`).
 *
 * `ADD VALUE` cannot run inside a transaction on Postgres < 12; on 16 it can,
 * provided the new label is not used in the same transaction. This migration
 * only adds labels, so it is safe. `IF NOT EXISTS` keeps it idempotent and
 * lets it no-op on a database built from a later baseline.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'purgeConsentLog';
    ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'retryDealSync';
    ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'purgeDealRegistrations';
    ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'refreshContentInsights';
    ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'refreshCrux';`)
}

export async function down(): Promise<void> {
  // Postgres cannot remove a value from an enum type. The five labels are left
  // in place; unused labels are harmless, and dropping the tasks is a
  // code-only change.
}
