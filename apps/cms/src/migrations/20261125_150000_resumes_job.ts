import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `resumes.job_id` so the Resumes list can be filtered by job, and backfills
 * it from the application each resume (or cover-letter file) belongs to.
 * Hand-written and idempotent: local databases run `push: true` and already
 * have the column.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "job_id" integer;`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE "resumes" ADD CONSTRAINT "resumes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "resumes_job_idx" ON "resumes" USING btree ("job_id");`)
  await db.execute(sql`UPDATE "resumes" r SET "job_id" = ca."job_id" FROM "career_applications" ca WHERE r."job_id" IS NULL AND ca."job_id" IS NOT NULL AND (ca."resume_id" = r."id" OR ca."cover_letter_file_id" = r."id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "resumes" DROP CONSTRAINT IF EXISTS "resumes_job_id_jobs_id_fk";`)
  await db.execute(sql`DROP INDEX IF EXISTS "resumes_job_idx";`)
  await db.execute(sql`ALTER TABLE "resumes" DROP COLUMN IF EXISTS "job_id";`)
}
