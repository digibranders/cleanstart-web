import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `eventPages` collection (nav label "Event Registrations"): events
 * hosted on events.cleanstart.com. Not versioned, so there is no `_event_pages_v`
 * mirror; publication is the `status` select. Its `partners` array has a table of
 * its own, and `registrationCount` is a virtual field with no column.
 *
 * Also adds `payload_locked_documents_rels.event_pages_id`: Payload loads that
 * whole row on any document-lock read, so leaving the column out breaks every
 * collection's list and edit view (the 2026-06-24 taxonomy incident).
 *
 * Hand-written rather than from `payload migrate:create` (it diffs against a June
 * snapshot and would emit hundreds of unrelated statements). Names follow the
 * ones Payload itself gave comparable objects (`departments`, a single upload
 * column in an array table), and the result was checked by creating and reading
 * events through the collection API on a database migrated with this file.
 *
 * Idempotent throughout: local databases run `push: true` and already have
 * these objects.
 */

const UP = [
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_event_pages_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`CREATE TABLE IF NOT EXISTS "event_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"status" "public"."enum_event_pages_status" DEFAULT 'draft' NOT NULL,
	"registration_open" boolean DEFAULT true,
	"description" varchar,
	"date_label" varchar,
	"venue" varchar,
	"registration_form_id" integer,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);`,
  sql`CREATE TABLE IF NOT EXISTS "event_pages_partners" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"url" varchar NOT NULL,
	"logo_id" integer
);`,
  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "event_pages_id" integer;`,
  sql`DO $$ BEGIN ALTER TABLE "event_pages" ADD CONSTRAINT "event_pages_registration_form_id_forms_id_fk" FOREIGN KEY ("registration_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "event_pages_partners" ADD CONSTRAINT "event_pages_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "event_pages_partners" ADD CONSTRAINT "event_pages_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."event_pages"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_pages_fk" FOREIGN KEY ("event_pages_id") REFERENCES "public"."event_pages"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "event_pages_slug_idx" ON "event_pages" USING btree ("slug");`,
  sql`CREATE INDEX IF NOT EXISTS "event_pages_registration_form_idx" ON "event_pages" USING btree ("registration_form_id");`,
  sql`CREATE INDEX IF NOT EXISTS "event_pages_updated_at_idx" ON "event_pages" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "event_pages_created_at_idx" ON "event_pages" USING btree ("created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "event_pages_partners_order_idx" ON "event_pages_partners" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "event_pages_partners_parent_id_idx" ON "event_pages_partners" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "event_pages_partners_logo_idx" ON "event_pages_partners" USING btree ("logo_id");`,
  sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_event_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("event_pages_id");`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "event_pages_id";`)
  await db.execute(sql`DROP TABLE IF EXISTS "event_pages_partners" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "event_pages" CASCADE;`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_event_pages_status";`)
}
