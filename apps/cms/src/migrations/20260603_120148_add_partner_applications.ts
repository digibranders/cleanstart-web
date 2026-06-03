import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_partner_applications_email_delivery_applicant_status" AS ENUM('synced', 'failed', 'skipped');
  CREATE TYPE "public"."enum_partner_applications_email_delivery_admin_status" AS ENUM('synced', 'failed', 'skipped');
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'partner_exported' BEFORE 'dsar_export';
  CREATE TABLE "partner_applications_consent_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );
  
  CREATE TABLE "partner_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"company" varchar NOT NULL,
  	"website" varchar,
  	"partner_reason" varchar,
  	"source" varchar,
  	"ip" varchar,
  	"user_agent" varchar,
  	"consent_given_at" timestamp(3) with time zone,
  	"consent_snapshot" varchar,
  	"privacy_policy_version" varchar,
  	"email_delivery_applicant_status" "enum_partner_applications_email_delivery_applicant_status",
  	"email_delivery_applicant_message_id" varchar,
  	"email_delivery_applicant_error" varchar,
  	"email_delivery_admin_status" "enum_partner_applications_email_delivery_admin_status",
  	"email_delivery_admin_message_id" varchar,
  	"email_delivery_admin_error" varchar,
  	"honeypot" varchar,
  	"turnstile_passed" boolean DEFAULT true,
  	"pii_redacted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "partner_applications_id" integer;
  ALTER TABLE "partner_applications_consent_categories" ADD CONSTRAINT "partner_applications_consent_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partner_applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "partner_applications_consent_categories_order_idx" ON "partner_applications_consent_categories" USING btree ("_order");
  CREATE INDEX "partner_applications_consent_categories_parent_id_idx" ON "partner_applications_consent_categories" USING btree ("_parent_id");
  CREATE INDEX "partner_applications_updated_at_idx" ON "partner_applications" USING btree ("updated_at");
  CREATE INDEX "partner_applications_created_at_idx" ON "partner_applications" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partner_applications_fk" FOREIGN KEY ("partner_applications_id") REFERENCES "public"."partner_applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_partner_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("partner_applications_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "partner_applications_consent_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partner_applications" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "partner_applications_consent_categories" CASCADE;
  DROP TABLE "partner_applications" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_partner_applications_fk";
  
  ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('lead_deleted', 'lead_exported', 'dsar_export', 'dsar_erasure', 'schema_override_changed', 'user_disabled', 'content_reassigned', 'display_publish_date_overridden');
  ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";
  DROP INDEX "payload_locked_documents_rels_partner_applications_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "partner_applications_id";
  DROP TYPE "public"."enum_partner_applications_email_delivery_applicant_status";
  DROP TYPE "public"."enum_partner_applications_email_delivery_admin_status";`)
}
