import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Deal-registrations collection (append-only): partner + prospect details, a
// HubSpot Deal sync status group, consent snapshot/categories, and PII fields.
// Mirrors the partner_applications shape; no versions/drafts (no _v tables).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_deal_registrations_hubspot_sync_status" AS ENUM('synced', 'failed', 'skipped');
  CREATE TABLE "deal_registrations_consent_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar
  );

  CREATE TABLE "deal_registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"partner_name" varchar NOT NULL,
  	"partner_rep_first_name" varchar NOT NULL,
  	"partner_rep_last_name" varchar NOT NULL,
  	"partner_rep_email" varchar NOT NULL,
  	"partner_rep_phone" varchar,
  	"prospect_first_name" varchar NOT NULL,
  	"prospect_last_name" varchar NOT NULL,
  	"prospect_email" varchar NOT NULL,
  	"prospect_phone" varchar,
  	"deal_details" varchar,
  	"source" varchar,
  	"ip" varchar,
  	"user_agent" varchar,
  	"consent_given_at" timestamp(3) with time zone,
  	"consent_snapshot" varchar,
  	"privacy_policy_version" varchar,
  	"hubspot_sync_status" "enum_deal_registrations_hubspot_sync_status",
  	"hubspot_sync_deal_id" varchar,
  	"hubspot_sync_error" varchar,
  	"hubspot_sync_attempts" numeric DEFAULT 0,
  	"hubspot_sync_last_attempt_at" timestamp(3) with time zone,
  	"honeypot" varchar,
  	"turnstile_passed" boolean DEFAULT true,
  	"pii_redacted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "deal_registrations_id" integer;
  ALTER TABLE "deal_registrations_consent_categories" ADD CONSTRAINT "deal_registrations_consent_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."deal_registrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "deal_registrations_consent_categories_order_idx" ON "deal_registrations_consent_categories" USING btree ("_order");
  CREATE INDEX "deal_registrations_consent_categories_parent_id_idx" ON "deal_registrations_consent_categories" USING btree ("_parent_id");
  CREATE INDEX "deal_registrations_updated_at_idx" ON "deal_registrations" USING btree ("updated_at");
  CREATE INDEX "deal_registrations_created_at_idx" ON "deal_registrations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_deal_registrations_fk" FOREIGN KEY ("deal_registrations_id") REFERENCES "public"."deal_registrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_deal_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("deal_registrations_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "deal_registrations_consent_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "deal_registrations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_deal_registrations_fk";
  DROP INDEX "payload_locked_documents_rels_deal_registrations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "deal_registrations_id";
  DROP TABLE "deal_registrations_consent_categories" CASCADE;
  DROP TABLE "deal_registrations" CASCADE;
  DROP TYPE "public"."enum_deal_registrations_hubspot_sync_status";`)
}
