import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `videos` collection (editorial videos listed at /videos, fed by the
 * YouTube sync) and the `videoTopics` taxonomy. `videos` is versioned with
 * drafts, so it has a `_videos_v` mirror. Videos play inline on the listing, so
 * there is no SEO group, no `schemaAddons` field and no `blocks_*` tables, and
 * the slug column exists but is hidden in the admin.
 *
 * Outside the new tables it touches three things:
 *   - `payload_locked_documents_rels.videos_id` / `.video_topics_id`: Payload
 *     loads that whole row on any document-lock read, so leaving them out breaks
 *     every collection's list and edit view (the 2026-06-24 taxonomy incident).
 *   - `enum_integrations_routing_events`, `enum_integrations_teams_config_mentions_trigger_on`
 *     and `enum_webhooks_dead_letter_event` gain 'video.needs-review' (the webhook
 *     event the sync fires when a new upload arrives as a draft; the dead-letter
 *     row for a failed delivery stores it).
 *   - `enum_payload_jobs_task_slug` and `enum_payload_jobs_log_task_slug` gain
 *     'syncYoutubeVideos' (the hourly sync task; a scheduled job whose slug is
 *     not in the enum fails to enqueue).
 *
 * Hand-reviewed rather than from `payload migrate:create` (it diffs against a
 * June snapshot and would emit hundreds of unrelated statements). The DDL was
 * extracted from the schema Payload pushed onto an empty scratch database for
 * the final collection definitions, and made idempotent by mechanical
 * rewriting: IF NOT EXISTS on tables and indexes, duplicate_object guards on
 * types and foreign keys. It was then applied twice to a clone of a pre-videos
 * database and the catalogs (columns, enums, indexes, constraints) compared
 * with the push: they match.
 *
 * This migration has not shipped, so it was edited in place when the SEO
 * group, the 'talk' format and the link-field and routing-collection 'videos'
 * targets were dropped from the collection.
 *
 * Idempotent throughout: local databases run `push: true` and already have
 * these objects.
 */

const UP = [
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__videos_v_version_format" AS ENUM('explainer', 'demo'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__videos_v_version_provider" AS ENUM('youtube', 'vimeo'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__videos_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__videos_v_version_sync_state" AS ENUM('synced', 'needs-review', 'missing', 'manual'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_videos_format" AS ENUM('explainer', 'demo'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_videos_provider" AS ENUM('youtube', 'vimeo'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_videos_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_videos_sync_state" AS ENUM('synced', 'needs-review', 'missing', 'manual'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`ALTER TYPE "public"."enum_integrations_routing_events" ADD VALUE IF NOT EXISTS 'video.needs-review';`,
  sql`ALTER TYPE "public"."enum_integrations_teams_config_mentions_trigger_on" ADD VALUE IF NOT EXISTS 'video.needs-review';`,
  sql`ALTER TYPE "public"."enum_webhooks_dead_letter_event" ADD VALUE IF NOT EXISTS 'video.needs-review';`,
  sql`ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE IF NOT EXISTS 'syncYoutubeVideos' BEFORE 'schedulePublish';`,
  sql`ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE IF NOT EXISTS 'syncYoutubeVideos' BEFORE 'schedulePublish';`,
  sql`CREATE TABLE IF NOT EXISTS "_videos_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_title" varchar,
	"version_slug" varchar,
	"version_provider" "public"."enum__videos_v_version_provider" DEFAULT 'youtube'::"public"."enum__videos_v_version_provider",
	"version_external_id" varchar,
	"version_format" "public"."enum__videos_v_version_format",
	"version_summary" varchar,
	"version_duration_label" varchar,
	"version_featured" boolean DEFAULT false,
	"version_sync_state" "public"."enum__videos_v_version_sync_state" DEFAULT 'manual'::"public"."enum__videos_v_version_sync_state",
	"version_source_title" varchar,
	"version_source_description" varchar,
	"version_source_duration_seconds" numeric,
	"version_source_published_at" timestamp(3) with time zone,
	"version_source_privacy_status" varchar,
	"version_source_embeddable" boolean,
	"version_source_has_maxres" boolean,
	"version_source_thumbnail_url" varchar,
	"version_source_content_hash" varchar,
	"version_source_fetched_at" timestamp(3) with time zone,
	"version_published_at" timestamp(3) with time zone,
	"version_display_published_at" timestamp(3) with time zone,
	"version_content_updated_at" timestamp(3) with time zone,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "public"."enum__videos_v_version_status" DEFAULT 'draft'::"public"."enum__videos_v_version_status",
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean
);`,
  sql`CREATE TABLE IF NOT EXISTS "_videos_v_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"video_topics_id" integer
);`,
  sql`CREATE TABLE IF NOT EXISTS "_videos_v_version_source_tags" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar,
	"_uuid" varchar
);`,
  sql`CREATE TABLE IF NOT EXISTS "video_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);`,
  sql`CREATE TABLE IF NOT EXISTS "video_topics_aliases" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar NOT NULL
);`,
  sql`CREATE TABLE IF NOT EXISTS "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"slug" varchar,
	"provider" "public"."enum_videos_provider" DEFAULT 'youtube'::"public"."enum_videos_provider",
	"external_id" varchar,
	"format" "public"."enum_videos_format",
	"summary" varchar,
	"duration_label" varchar,
	"featured" boolean DEFAULT false,
	"sync_state" "public"."enum_videos_sync_state" DEFAULT 'manual'::"public"."enum_videos_sync_state",
	"source_title" varchar,
	"source_description" varchar,
	"source_duration_seconds" numeric,
	"source_published_at" timestamp(3) with time zone,
	"source_privacy_status" varchar,
	"source_embeddable" boolean,
	"source_has_maxres" boolean,
	"source_thumbnail_url" varchar,
	"source_content_hash" varchar,
	"source_fetched_at" timestamp(3) with time zone,
	"published_at" timestamp(3) with time zone,
	"display_published_at" timestamp(3) with time zone,
	"content_updated_at" timestamp(3) with time zone,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "public"."enum_videos_status" DEFAULT 'draft'::"public"."enum_videos_status"
);`,
  sql`CREATE TABLE IF NOT EXISTS "videos_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"video_topics_id" integer
);`,
  sql`CREATE TABLE IF NOT EXISTS "videos_source_tags" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar
);`,
  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "videos_id" integer;`,
  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "video_topics_id" integer;`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_created_at_idx" ON "_videos_v" USING btree ("created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_latest_idx" ON "_videos_v" USING btree ("latest");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_parent_idx" ON "_videos_v" USING btree ("parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_rels_order_idx" ON "_videos_v_rels" USING btree ("order");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_rels_parent_idx" ON "_videos_v_rels" USING btree ("parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_rels_path_idx" ON "_videos_v_rels" USING btree ("path");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_rels_video_topics_id_idx" ON "_videos_v_rels" USING btree ("video_topics_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_updated_at_idx" ON "_videos_v" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_version_source_tags_order_idx" ON "_videos_v_version_source_tags" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_version_source_tags_parent_id_idx" ON "_videos_v_version_source_tags" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_version_version__status_idx" ON "_videos_v" USING btree ("version__status");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_version_version_created_at_idx" ON "_videos_v" USING btree ("version_created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_version_version_display_published_at_idx" ON "_videos_v" USING btree ("version_display_published_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_version_version_external_id_idx" ON "_videos_v" USING btree ("version_external_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_version_version_slug_idx" ON "_videos_v" USING btree ("version_slug");`,
  sql`CREATE INDEX IF NOT EXISTS "_videos_v_version_version_updated_at_idx" ON "_videos_v" USING btree ("version_updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_video_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("video_topics_id");`,
  sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");`,
  sql`CREATE INDEX IF NOT EXISTS "video_topics_aliases_order_idx" ON "video_topics_aliases" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "video_topics_aliases_parent_id_idx" ON "video_topics_aliases" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "video_topics_created_at_idx" ON "video_topics" USING btree ("created_at");`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "video_topics_slug_idx" ON "video_topics" USING btree ("slug");`,
  sql`CREATE INDEX IF NOT EXISTS "video_topics_updated_at_idx" ON "video_topics" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "videos__status_idx" ON "videos" USING btree ("_status");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_created_at_idx" ON "videos" USING btree ("created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_display_published_at_idx" ON "videos" USING btree ("display_published_at");`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "videos_external_id_idx" ON "videos" USING btree ("external_id");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_rels_order_idx" ON "videos_rels" USING btree ("order");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_rels_parent_idx" ON "videos_rels" USING btree ("parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_rels_path_idx" ON "videos_rels" USING btree ("path");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_rels_video_topics_id_idx" ON "videos_rels" USING btree ("video_topics_id");`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "videos_slug_idx" ON "videos" USING btree ("slug");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_source_tags_order_idx" ON "videos_source_tags" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_source_tags_parent_id_idx" ON "videos_source_tags" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "videos_updated_at_idx" ON "videos" USING btree ("updated_at");`,
  sql`DO $$ BEGIN ALTER TABLE "_videos_v" ADD CONSTRAINT "_videos_v_parent_id_videos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_videos_v_rels" ADD CONSTRAINT "_videos_v_rels_video_topics_fk" FOREIGN KEY ("video_topics_id") REFERENCES "public"."video_topics"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_videos_v_version_source_tags" ADD CONSTRAINT "_videos_v_version_source_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_videos_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_video_topics_fk" FOREIGN KEY ("video_topics_id") REFERENCES "public"."video_topics"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "video_topics_aliases" ADD CONSTRAINT "video_topics_aliases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."video_topics"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "videos_rels" ADD CONSTRAINT "videos_rels_video_topics_fk" FOREIGN KEY ("video_topics_id") REFERENCES "public"."video_topics"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "videos_source_tags" ADD CONSTRAINT "videos_source_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "videos_id";`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "video_topics_id";`)
  await db.execute(sql`DROP TABLE IF EXISTS "videos_source_tags" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "videos_rels" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "videos" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "video_topics_aliases" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "video_topics" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_videos_v_version_source_tags" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_videos_v_rels" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_videos_v" CASCADE;`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__videos_v_version_format";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__videos_v_version_provider";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__videos_v_version_status";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__videos_v_version_sync_state";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_videos_format";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_videos_provider";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_videos_status";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_videos_sync_state";`)
  // Postgres cannot drop a single enum label, so 'video.needs-review' stays on
  // enum_integrations_routing_events, enum_integrations_teams_config_mentions_trigger_on and
  // enum_webhooks_dead_letter_event, and 'syncYoutubeVideos' on the two payload_jobs
  // task-slug enums. Unused labels are harmless.
}
