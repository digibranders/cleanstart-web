import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_career_applications_email_delivery_status" AS ENUM('synced', 'failed', 'skipped');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'purgeCareerApplications' BEFORE 'purgePreviewAudit';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'purgeCareerApplications' BEFORE 'purgePreviewAudit';
  CREATE TABLE "resumes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prefix" varchar DEFAULT 'dev/resumes',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "career_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"job_id" integer NOT NULL,
  	"job_title_snapshot" varchar NOT NULL,
  	"first_name" varchar,
  	"last_name" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"cover_letter" varchar,
  	"linkedin_url" varchar,
  	"resume_id" integer NOT NULL,
  	"source" varchar,
  	"ip" varchar,
  	"user_agent" varchar,
  	"consent_given_at" timestamp(3) with time zone,
  	"consent_snapshot" varchar,
  	"privacy_policy_version" varchar,
  	"email_delivery_status" "enum_career_applications_email_delivery_status",
  	"email_delivery_message_id" varchar,
  	"email_delivery_error" varchar,
  	"honeypot" varchar,
  	"turnstile_passed" boolean DEFAULT true,
  	"pii_redacted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "resumes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "career_applications_id" integer;
  ALTER TABLE "career_applications" ADD CONSTRAINT "career_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "career_applications" ADD CONSTRAINT "career_applications_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "resumes_updated_at_idx" ON "resumes" USING btree ("updated_at");
  CREATE INDEX "resumes_created_at_idx" ON "resumes" USING btree ("created_at");
  CREATE UNIQUE INDEX "resumes_filename_idx" ON "resumes" USING btree ("filename");
  CREATE INDEX "career_applications_job_idx" ON "career_applications" USING btree ("job_id");
  CREATE INDEX "career_applications_resume_idx" ON "career_applications" USING btree ("resume_id");
  CREATE INDEX "career_applications_updated_at_idx" ON "career_applications" USING btree ("updated_at");
  CREATE INDEX "career_applications_created_at_idx" ON "career_applications" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resumes_fk" FOREIGN KEY ("resumes_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_career_applications_fk" FOREIGN KEY ("career_applications_id") REFERENCES "public"."career_applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_resumes_id_idx" ON "payload_locked_documents_rels" USING btree ("resumes_id");
  CREATE INDEX "payload_locked_documents_rels_career_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("career_applications_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "resumes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "career_applications" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "resumes" CASCADE;
  DROP TABLE "career_applications" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_resumes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_career_applications_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'drainLeadQueue', 'purgeSearchLog', 'purgeLeadsPii', 'purgePreviewAudit', 'checkBrokenLinks', 'retryWebhook', 'meiliReindex', 'dashboardRefreshFrequent', 'dashboardRefreshDaily', 'analyticsCachePrune', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'drainLeadQueue', 'purgeSearchLog', 'purgeLeadsPii', 'purgePreviewAudit', 'checkBrokenLinks', 'retryWebhook', 'meiliReindex', 'dashboardRefreshFrequent', 'dashboardRefreshDaily', 'analyticsCachePrune', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_resumes_id_idx";
  DROP INDEX "payload_locked_documents_rels_career_applications_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "resumes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "career_applications_id";
  DROP TYPE "public"."enum_career_applications_email_delivery_status";`)
}
