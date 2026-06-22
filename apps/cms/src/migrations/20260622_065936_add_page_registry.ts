import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_registry_kind" AS ENUM('static', 'cms-listing', 'cms-template');
  CREATE TABLE "page_registry" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_page_registry_kind" DEFAULT 'static' NOT NULL,
  	"backing_collection" varchar,
  	"additional_schema" jsonb,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "page_registry_id" integer;
  CREATE UNIQUE INDEX "page_registry_path_idx" ON "page_registry" USING btree ("path");
  CREATE INDEX "page_registry_updated_at_idx" ON "page_registry" USING btree ("updated_at");
  CREATE INDEX "page_registry_created_at_idx" ON "page_registry" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_registry_fk" FOREIGN KEY ("page_registry_id") REFERENCES "public"."page_registry"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_page_registry_id_idx" ON "payload_locked_documents_rels" USING btree ("page_registry_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_registry" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "page_registry" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_page_registry_fk";
  DROP INDEX "payload_locked_documents_rels_page_registry_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "page_registry_id";
  DROP TYPE "public"."enum_page_registry_kind";`)
}
