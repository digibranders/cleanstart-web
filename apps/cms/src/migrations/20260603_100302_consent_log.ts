import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_consent_log_decision" AS ENUM('accept_all', 'reject_all', 'custom');
  CREATE TABLE "consent_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"anonymous_id" varchar NOT NULL,
  	"decision" "enum_consent_log_decision" NOT NULL,
  	"categories" jsonb NOT NULL,
  	"consent_version" numeric NOT NULL,
  	"gpc" boolean DEFAULT false,
  	"country" varchar,
  	"ip_hash" varchar,
  	"user_agent_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consent_log_id" integer;
  CREATE INDEX "consent_log_anonymous_id_idx" ON "consent_log" USING btree ("anonymous_id");
  CREATE INDEX "consent_log_updated_at_idx" ON "consent_log" USING btree ("updated_at");
  CREATE INDEX "consent_log_created_at_idx" ON "consent_log" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consent_log_fk" FOREIGN KEY ("consent_log_id") REFERENCES "public"."consent_log"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_consent_log_id_idx" ON "payload_locked_documents_rels" USING btree ("consent_log_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "consent_log" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "consent_log" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consent_log_fk";
  
  DROP INDEX "payload_locked_documents_rels_consent_log_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "consent_log_id";
  DROP TYPE "public"."enum_consent_log_decision";`)
}
