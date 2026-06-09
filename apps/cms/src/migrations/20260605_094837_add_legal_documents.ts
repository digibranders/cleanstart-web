import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_legal_documents_icon" AS ENUM('FileText', 'FileLock2', 'ScrollText', 'BadgeCheck', 'FileCheck2', 'Stamp', 'Bug', 'Scale', 'FileSignature', 'ShieldCheck');
  CREATE TYPE "public"."enum_legal_documents_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_documents_v_version_icon" AS ENUM('FileText', 'FileLock2', 'ScrollText', 'BadgeCheck', 'FileCheck2', 'Stamp', 'Bug', 'Scale', 'FileSignature', 'ShieldCheck');
  CREATE TYPE "public"."enum__legal_documents_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "legal_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"order" numeric DEFAULT 99,
  	"icon" "enum_legal_documents_icon" DEFAULT 'FileText',
  	"effective_date" timestamp(3) with time zone,
  	"body" jsonb,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"change_summary" varchar,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_legal_documents_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_legal_documents_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 99,
  	"version_icon" "enum__legal_documents_v_version_icon" DEFAULT 'FileText',
  	"version_effective_date" timestamp(3) with time zone,
  	"version_body" jsonb,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_change_summary" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__legal_documents_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "legal_documents_id" integer;
  ALTER TABLE "_legal_documents_v" ADD CONSTRAINT "_legal_documents_v_parent_id_legal_documents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."legal_documents"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "legal_documents_slug_idx" ON "legal_documents" USING btree ("slug");
  CREATE INDEX "legal_documents_display_published_at_idx" ON "legal_documents" USING btree ("display_published_at");
  CREATE INDEX "legal_documents_updated_at_idx" ON "legal_documents" USING btree ("updated_at");
  CREATE INDEX "legal_documents_created_at_idx" ON "legal_documents" USING btree ("created_at");
  CREATE INDEX "legal_documents__status_idx" ON "legal_documents" USING btree ("_status");
  CREATE INDEX "_legal_documents_v_parent_idx" ON "_legal_documents_v" USING btree ("parent_id");
  CREATE INDEX "_legal_documents_v_version_version_slug_idx" ON "_legal_documents_v" USING btree ("version_slug");
  CREATE INDEX "_legal_documents_v_version_version_display_published_at_idx" ON "_legal_documents_v" USING btree ("version_display_published_at");
  CREATE INDEX "_legal_documents_v_version_version_updated_at_idx" ON "_legal_documents_v" USING btree ("version_updated_at");
  CREATE INDEX "_legal_documents_v_version_version_created_at_idx" ON "_legal_documents_v" USING btree ("version_created_at");
  CREATE INDEX "_legal_documents_v_version_version__status_idx" ON "_legal_documents_v" USING btree ("version__status");
  CREATE INDEX "_legal_documents_v_created_at_idx" ON "_legal_documents_v" USING btree ("created_at");
  CREATE INDEX "_legal_documents_v_updated_at_idx" ON "_legal_documents_v" USING btree ("updated_at");
  CREATE INDEX "_legal_documents_v_latest_idx" ON "_legal_documents_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_legal_documents_fk" FOREIGN KEY ("legal_documents_id") REFERENCES "public"."legal_documents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_legal_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("legal_documents_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "legal_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_legal_documents_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "legal_documents" CASCADE;
  DROP TABLE "_legal_documents_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_legal_documents_fk";
  
  DROP INDEX "payload_locked_documents_rels_legal_documents_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "legal_documents_id";
  DROP TYPE "public"."enum_legal_documents_icon";
  DROP TYPE "public"."enum_legal_documents_status";
  DROP TYPE "public"."enum__legal_documents_v_version_icon";
  DROP TYPE "public"."enum__legal_documents_v_version_status";`)
}
