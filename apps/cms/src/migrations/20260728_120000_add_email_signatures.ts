import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Email-signature collections (Brand group):
//   emailSignatures    — per-employee data, versioned (no drafts) → _v table
//   signatureTemplates — shared markup, versioned WITH drafts → _v table + _status
//   emailAssets        — upload collection for images embedded in outbound mail
//
// The three `payload_locked_documents_rels` columns at the end are the part
// that matters most: Payload's relational query loads that whole row on any
// document-lock read, so omitting them breaks EVERY collection's list and edit
// view, not just these three. That is exactly what happened with the taxonomy
// collections on 2026-06-24.
//
// DDL transcribed from the schema Payload itself pushed onto a dev database,
// so it matches what the ORM expects column-for-column. One deliberate
// deviation: `email_assets.prefix` is created WITHOUT the DB-level default the
// push produced ('dev/emails'), because that value is environment-derived —
// the storage plugin writes the correct prefix per upload at runtime.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_email_signatures_group" AS ENUM('Executive Leadership', 'Sales & Regional Leadership', 'Marketing & Communications', 'HR & People Operations', 'Account Management & Sales Operations', 'Engineering & Technical Solutions');
  CREATE TYPE "public"."enum__email_signatures_v_version_group" AS ENUM('Executive Leadership', 'Sales & Regional Leadership', 'Marketing & Communications', 'HR & People Operations', 'Account Management & Sales Operations', 'Engineering & Technical Solutions');
  CREATE TYPE "public"."enum_signature_templates_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__signature_templates_v_version_status" AS ENUM('draft', 'published');

  CREATE TABLE "signature_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"html" varchar,
  	"is_default" boolean DEFAULT false,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "public"."enum_signature_templates_status" DEFAULT 'draft'
  );

  CREATE TABLE "_signature_templates_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_html" varchar,
  	"version_is_default" boolean DEFAULT false,
  	"version_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "public"."enum__signature_templates_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );

  CREATE TABLE "email_signatures" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"job_title" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone_e164" varchar NOT NULL,
  	"phone_display" varchar,
  	"template_id" integer NOT NULL,
  	"group" "public"."enum_email_signatures_group" NOT NULL,
  	"sort_order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "_email_signatures_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_job_title" varchar NOT NULL,
  	"version_email" varchar NOT NULL,
  	"version_phone_e164" varchar NOT NULL,
  	"version_phone_display" varchar,
  	"version_template_id" integer NOT NULL,
  	"version_group" "public"."enum__email_signatures_v_version_group" NOT NULL,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_active" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "email_assets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"usage" varchar,
  	"prefix" varchar,
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

  ALTER TABLE "_signature_templates_v" ADD CONSTRAINT "_signature_templates_v_parent_id_signature_templates_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."signature_templates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "email_signatures" ADD CONSTRAINT "email_signatures_template_id_signature_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."signature_templates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_email_signatures_v" ADD CONSTRAINT "_email_signatures_v_parent_id_email_signatures_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."email_signatures"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_email_signatures_v" ADD CONSTRAINT "_email_signatures_v_version_template_id_signature_templates_id_" FOREIGN KEY ("version_template_id") REFERENCES "public"."signature_templates"("id") ON DELETE set null ON UPDATE no action;

  CREATE UNIQUE INDEX "signature_templates_slug_idx" ON "signature_templates" USING btree ("slug");
  CREATE INDEX "signature_templates_updated_at_idx" ON "signature_templates" USING btree ("updated_at");
  CREATE INDEX "signature_templates_created_at_idx" ON "signature_templates" USING btree ("created_at");
  CREATE INDEX "signature_templates__status_idx" ON "signature_templates" USING btree ("_status");
  CREATE INDEX "_signature_templates_v_parent_idx" ON "_signature_templates_v" USING btree ("parent_id");
  CREATE INDEX "_signature_templates_v_version_version_slug_idx" ON "_signature_templates_v" USING btree ("version_slug");
  CREATE INDEX "_signature_templates_v_version_version_updated_at_idx" ON "_signature_templates_v" USING btree ("version_updated_at");
  CREATE INDEX "_signature_templates_v_version_version_created_at_idx" ON "_signature_templates_v" USING btree ("version_created_at");
  CREATE INDEX "_signature_templates_v_version_version__status_idx" ON "_signature_templates_v" USING btree ("version__status");
  CREATE INDEX "_signature_templates_v_created_at_idx" ON "_signature_templates_v" USING btree ("created_at");
  CREATE INDEX "_signature_templates_v_updated_at_idx" ON "_signature_templates_v" USING btree ("updated_at");
  CREATE INDEX "_signature_templates_v_latest_idx" ON "_signature_templates_v" USING btree ("latest");
  CREATE UNIQUE INDEX "email_signatures_slug_idx" ON "email_signatures" USING btree ("slug");
  CREATE INDEX "email_signatures_template_idx" ON "email_signatures" USING btree ("template_id");
  CREATE INDEX "email_signatures_updated_at_idx" ON "email_signatures" USING btree ("updated_at");
  CREATE INDEX "email_signatures_created_at_idx" ON "email_signatures" USING btree ("created_at");
  CREATE INDEX "_email_signatures_v_parent_idx" ON "_email_signatures_v" USING btree ("parent_id");
  CREATE INDEX "_email_signatures_v_version_version_slug_idx" ON "_email_signatures_v" USING btree ("version_slug");
  CREATE INDEX "_email_signatures_v_version_version_template_idx" ON "_email_signatures_v" USING btree ("version_template_id");
  CREATE INDEX "_email_signatures_v_version_version_updated_at_idx" ON "_email_signatures_v" USING btree ("version_updated_at");
  CREATE INDEX "_email_signatures_v_version_version_created_at_idx" ON "_email_signatures_v" USING btree ("version_created_at");
  CREATE INDEX "_email_signatures_v_created_at_idx" ON "_email_signatures_v" USING btree ("created_at");
  CREATE INDEX "_email_signatures_v_updated_at_idx" ON "_email_signatures_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "email_assets_filename_idx" ON "email_assets" USING btree ("filename");
  CREATE INDEX "email_assets_updated_at_idx" ON "email_assets" USING btree ("updated_at");
  CREATE INDEX "email_assets_created_at_idx" ON "email_assets" USING btree ("created_at");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_signatures_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "signature_templates_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_assets_id" integer;

  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_signatures_fk" FOREIGN KEY ("email_signatures_id") REFERENCES "public"."email_signatures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_signature_templates_fk" FOREIGN KEY ("signature_templates_id") REFERENCES "public"."signature_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_assets_fk" FOREIGN KEY ("email_assets_id") REFERENCES "public"."email_assets"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "payload_locked_documents_rels_email_signatures_id_idx" ON "payload_locked_documents_rels" USING btree ("email_signatures_id");
  CREATE INDEX "payload_locked_documents_rels_signature_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("signature_templates_id");
  CREATE INDEX "payload_locked_documents_rels_email_assets_id_idx" ON "payload_locked_documents_rels" USING btree ("email_assets_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_email_signatures_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_signature_templates_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_email_assets_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_email_signatures_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_signature_templates_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_email_assets_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "email_signatures_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "signature_templates_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "email_assets_id";

  DROP TABLE IF EXISTS "_email_signatures_v" CASCADE;
  DROP TABLE IF EXISTS "email_signatures" CASCADE;
  DROP TABLE IF EXISTS "_signature_templates_v" CASCADE;
  DROP TABLE IF EXISTS "signature_templates" CASCADE;
  DROP TABLE IF EXISTS "email_assets" CASCADE;

  DROP TYPE IF EXISTS "public"."enum__email_signatures_v_version_group";
  DROP TYPE IF EXISTS "public"."enum_email_signatures_group";
  DROP TYPE IF EXISTS "public"."enum__signature_templates_v_version_status";
  DROP TYPE IF EXISTS "public"."enum_signature_templates_status";
  `)
}
