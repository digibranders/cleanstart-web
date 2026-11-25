import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Gives `eventPages` the Draft and Publish workflow: `versions: { drafts: true }`
 * replaces the plain `status` select added by 20261125_100000_add_event_pages.
 *
 *   - `event_pages._status` reuses the existing `enum_event_pages_status`
 *     ('draft', 'published'), so the old column's values carry over: they are
 *     copied across and the `status` column is dropped.
 *   - `_event_pages_v` (the versions table), its `partners` array table and the
 *     version enum are new. Names follow the ones Payload gave the `videos`
 *     versions tables.
 *
 * Hand-written like its predecessor (see add_event_pages for why) and idempotent:
 * local databases run `push: true` and already have these objects.
 */

const UP = [
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__event_pages_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`ALTER TABLE "event_pages" ADD COLUMN IF NOT EXISTS "_status" "public"."enum_event_pages_status" DEFAULT 'draft';`,
  sql`DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_pages' AND column_name = 'status') THEN UPDATE "event_pages" SET "_status" = "status"::text::"public"."enum_event_pages_status"; ALTER TABLE "event_pages" DROP COLUMN "status"; END IF; END $$;`,
  sql`CREATE TABLE IF NOT EXISTS "_event_pages_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_title" varchar,
	"version_slug" varchar,
	"version_registration_open" boolean DEFAULT true,
	"version_description" varchar,
	"version_date_label" varchar,
	"version_venue" varchar,
	"version_registration_form_id" integer,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "public"."enum__event_pages_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean
);`,
  sql`CREATE TABLE IF NOT EXISTS "_event_pages_v_version_partners" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"url" varchar,
	"logo_id" integer,
	"_uuid" varchar
);`,
  sql`DO $$ BEGIN ALTER TABLE "_event_pages_v" ADD CONSTRAINT "_event_pages_v_parent_id_event_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."event_pages"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_event_pages_v" ADD CONSTRAINT "_event_pages_v_version_registration_form_id_forms_id_fk" FOREIGN KEY ("version_registration_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_event_pages_v_version_partners" ADD CONSTRAINT "_event_pages_v_version_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_event_pages_v_version_partners" ADD CONSTRAINT "_event_pages_v_version_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_event_pages_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`CREATE INDEX IF NOT EXISTS "event_pages__status_idx" ON "event_pages" USING btree ("_status");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_parent_idx" ON "_event_pages_v" USING btree ("parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_version_version_slug_idx" ON "_event_pages_v" USING btree ("version_slug");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_version_version_registration_form_idx" ON "_event_pages_v" USING btree ("version_registration_form_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_version_version_updated_at_idx" ON "_event_pages_v" USING btree ("version_updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_version_version_created_at_idx" ON "_event_pages_v" USING btree ("version_created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_version_version__status_idx" ON "_event_pages_v" USING btree ("version__status");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_created_at_idx" ON "_event_pages_v" USING btree ("created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_updated_at_idx" ON "_event_pages_v" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_latest_idx" ON "_event_pages_v" USING btree ("latest");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_version_partners_order_idx" ON "_event_pages_v_version_partners" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_version_partners_parent_id_idx" ON "_event_pages_v_version_partners" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_event_pages_v_version_partners_logo_idx" ON "_event_pages_v_version_partners" USING btree ("logo_id");`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "event_pages" ADD COLUMN IF NOT EXISTS "status" "public"."enum_event_pages_status" DEFAULT 'draft' NOT NULL;`)
  await db.execute(sql`UPDATE "event_pages" SET "status" = COALESCE("_status", 'draft');`)
  await db.execute(sql`DROP TABLE IF EXISTS "_event_pages_v_version_partners" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_event_pages_v" CASCADE;`)
  await db.execute(sql`ALTER TABLE "event_pages" DROP COLUMN IF EXISTS "_status";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__event_pages_v_version_status";`)
}
