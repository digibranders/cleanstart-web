import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_news_press_type" AS ENUM('press-release', 'news', 'announcement', 'feature');
  CREATE TYPE "public"."enum__news_v_version_press_type" AS ENUM('press-release', 'news', 'announcement', 'feature');
  CREATE TYPE "public"."enum_podcast_episodes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__podcast_episodes_v_version_status" AS ENUM('draft', 'published');
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'display_publish_date_overridden';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'purgePreviewAudit' BEFORE 'checkBrokenLinks';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'purgePreviewAudit' BEFORE 'checkBrokenLinks';
  CREATE TABLE "preview_audit" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection" varchar NOT NULL,
  	"doc_id" varchar NOT NULL,
  	"actor_id" integer NOT NULL,
  	"label" varchar,
  	"ttl_seconds" numeric NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"revoked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "podcast_episodes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"episode_number" numeric,
  	"youtube_url" varchar,
  	"youtube_video_id" varchar,
  	"thumbnail_override_id" integer,
  	"abstract" varchar,
  	"duration_seconds" numeric,
  	"featured" boolean DEFAULT false,
  	"publication_date" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_podcast_episodes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_podcast_episodes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_episode_number" numeric,
  	"version_youtube_url" varchar,
  	"version_youtube_video_id" varchar,
  	"version_thumbnail_override_id" integer,
  	"version_abstract" varchar,
  	"version_duration_seconds" numeric,
  	"version_featured" boolean DEFAULT false,
  	"version_publication_date" timestamp(3) with time zone,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__podcast_episodes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "podcast_page_cta_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL
  );
  
  CREATE TABLE "podcast_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar,
  	"hero_title" varchar DEFAULT 'Leadership Exchange' NOT NULL,
  	"hero_title_highlight" varchar DEFAULT 'Exchange' NOT NULL,
  	"hero_subtitle" varchar,
  	"featured_hero_episode_id" integer,
  	"latest_episodes_title" varchar DEFAULT 'Latest Episodes',
  	"latest_episodes_limit" numeric DEFAULT 6,
  	"featured_section_title" varchar DEFAULT 'Featured Content',
  	"featured_section_highlight" varchar DEFAULT 'Content',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_podcast_page_v_version_cta_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_podcast_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_eyebrow" varchar,
  	"version_hero_title" varchar DEFAULT 'Leadership Exchange' NOT NULL,
  	"version_hero_title_highlight" varchar DEFAULT 'Exchange' NOT NULL,
  	"version_hero_subtitle" varchar,
  	"version_featured_hero_episode_id" integer,
  	"version_latest_episodes_title" varchar DEFAULT 'Latest Episodes',
  	"version_latest_episodes_limit" numeric DEFAULT 6,
  	"version_featured_section_title" varchar DEFAULT 'Featured Content',
  	"version_featured_section_highlight" varchar DEFAULT 'Content',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "resources" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_resources_type";
  CREATE TYPE "public"."enum_resources_type" AS ENUM('whitepaper', 'ebook', 'datasheet', 'architecture-insights', 'report');
  ALTER TABLE "resources" ALTER COLUMN "type" SET DATA TYPE "public"."enum_resources_type" USING "type"::"public"."enum_resources_type";
  ALTER TABLE "_resources_v" ALTER COLUMN "version_type" SET DATA TYPE text;
  DROP TYPE "public"."enum__resources_v_version_type";
  CREATE TYPE "public"."enum__resources_v_version_type" AS ENUM('whitepaper', 'ebook', 'datasheet', 'architecture-insights', 'report');
  ALTER TABLE "_resources_v" ALTER COLUMN "version_type" SET DATA TYPE "public"."enum__resources_v_version_type" USING "version_type"::"public"."enum__resources_v_version_type";
  ALTER TABLE "webinars" ALTER COLUMN "region" SET DATA TYPE text;
  ALTER TABLE "webinars" ALTER COLUMN "region" SET DEFAULT 'global'::text;
  DROP TYPE "public"."enum_webinars_region";
  CREATE TYPE "public"."enum_webinars_region" AS ENUM('north-america', 'asia-mea', 'emea', 'global');
  ALTER TABLE "webinars" ALTER COLUMN "region" SET DEFAULT 'global'::"public"."enum_webinars_region";
  ALTER TABLE "webinars" ALTER COLUMN "region" SET DATA TYPE "public"."enum_webinars_region" USING "region"::"public"."enum_webinars_region";
  ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DATA TYPE text;
  ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DEFAULT 'global'::text;
  DROP TYPE "public"."enum__webinars_v_version_region";
  CREATE TYPE "public"."enum__webinars_v_version_region" AS ENUM('north-america', 'asia-mea', 'emea', 'global');
  ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DEFAULT 'global'::"public"."enum__webinars_v_version_region";
  ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DATA TYPE "public"."enum__webinars_v_version_region" USING "version_region"::"public"."enum__webinars_v_version_region";
  ALTER TABLE "blogs" ADD COLUMN "display_published_at" timestamp(3) with time zone;
  ALTER TABLE "_blogs_v" ADD COLUMN "version_display_published_at" timestamp(3) with time zone;
  ALTER TABLE "news" ADD COLUMN "publisher" varchar;
  ALTER TABLE "news" ADD COLUMN "publisher_logo_id" integer;
  ALTER TABLE "news" ADD COLUMN "press_type" "enum_news_press_type" DEFAULT 'press-release';
  ALTER TABLE "news" ADD COLUMN "location" varchar;
  ALTER TABLE "_news_v" ADD COLUMN "version_publisher" varchar;
  ALTER TABLE "_news_v" ADD COLUMN "version_publisher_logo_id" integer;
  ALTER TABLE "_news_v" ADD COLUMN "version_press_type" "enum__news_v_version_press_type" DEFAULT 'press-release';
  ALTER TABLE "_news_v" ADD COLUMN "version_location" varchar;
  ALTER TABLE "guides" ADD COLUMN "display_published_at" timestamp(3) with time zone;
  ALTER TABLE "_guides_v" ADD COLUMN "version_display_published_at" timestamp(3) with time zone;
  ALTER TABLE "resources" ADD COLUMN "display_published_at" timestamp(3) with time zone;
  ALTER TABLE "_resources_v" ADD COLUMN "version_display_published_at" timestamp(3) with time zone;
  ALTER TABLE "knowledge_base" ADD COLUMN "display_published_at" timestamp(3) with time zone;
  ALTER TABLE "_knowledge_base_v" ADD COLUMN "version_display_published_at" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "cta_label" varchar;
  ALTER TABLE "events" ADD COLUMN "post_event_cta_enabled" boolean DEFAULT false;
  ALTER TABLE "events" ADD COLUMN "post_event_cta_label" varchar;
  ALTER TABLE "events" ADD COLUMN "post_event_cta_url" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_cta_label" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_post_event_cta_enabled" boolean DEFAULT false;
  ALTER TABLE "_events_v" ADD COLUMN "version_post_event_cta_label" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_post_event_cta_url" varchar;
  ALTER TABLE "webinars" ADD COLUMN "display_published_at" timestamp(3) with time zone;
  ALTER TABLE "_webinars_v" ADD COLUMN "version_display_published_at" timestamp(3) with time zone;
  ALTER TABLE "jobs" ADD COLUMN "display_published_at" timestamp(3) with time zone;
  ALTER TABLE "_jobs_v" ADD COLUMN "version_display_published_at" timestamp(3) with time zone;
  ALTER TABLE "pages" ADD COLUMN "display_published_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_display_published_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "preview_audit_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "podcast_episodes_id" integer;
  ALTER TABLE "preview_audit" ADD CONSTRAINT "preview_audit_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_thumbnail_override_id_media_id_fk" FOREIGN KEY ("thumbnail_override_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v" ADD CONSTRAINT "_podcast_episodes_v_parent_id_podcast_episodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_episodes_v" ADD CONSTRAINT "_podcast_episodes_v_version_thumbnail_override_id_media_id_fk" FOREIGN KEY ("version_thumbnail_override_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcast_page_cta_cards" ADD CONSTRAINT "podcast_page_cta_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."podcast_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcast_page" ADD CONSTRAINT "podcast_page_featured_hero_episode_id_podcast_episodes_id_fk" FOREIGN KEY ("featured_hero_episode_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_page_v_version_cta_cards" ADD CONSTRAINT "_podcast_page_v_version_cta_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_podcast_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_podcast_page_v" ADD CONSTRAINT "_podcast_page_v_version_featured_hero_episode_id_podcast_episodes_id_fk" FOREIGN KEY ("version_featured_hero_episode_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "preview_audit_actor_idx" ON "preview_audit" USING btree ("actor_id");
  CREATE INDEX "preview_audit_updated_at_idx" ON "preview_audit" USING btree ("updated_at");
  CREATE INDEX "preview_audit_created_at_idx" ON "preview_audit" USING btree ("created_at");
  CREATE UNIQUE INDEX "podcast_episodes_slug_idx" ON "podcast_episodes" USING btree ("slug");
  CREATE INDEX "podcast_episodes_thumbnail_override_idx" ON "podcast_episodes" USING btree ("thumbnail_override_id");
  CREATE INDEX "podcast_episodes_display_published_at_idx" ON "podcast_episodes" USING btree ("display_published_at");
  CREATE INDEX "podcast_episodes_updated_at_idx" ON "podcast_episodes" USING btree ("updated_at");
  CREATE INDEX "podcast_episodes_created_at_idx" ON "podcast_episodes" USING btree ("created_at");
  CREATE INDEX "podcast_episodes__status_idx" ON "podcast_episodes" USING btree ("_status");
  CREATE INDEX "_podcast_episodes_v_parent_idx" ON "_podcast_episodes_v" USING btree ("parent_id");
  CREATE INDEX "_podcast_episodes_v_version_version_slug_idx" ON "_podcast_episodes_v" USING btree ("version_slug");
  CREATE INDEX "_podcast_episodes_v_version_version_thumbnail_override_idx" ON "_podcast_episodes_v" USING btree ("version_thumbnail_override_id");
  CREATE INDEX "_podcast_episodes_v_version_version_display_published_at_idx" ON "_podcast_episodes_v" USING btree ("version_display_published_at");
  CREATE INDEX "_podcast_episodes_v_version_version_updated_at_idx" ON "_podcast_episodes_v" USING btree ("version_updated_at");
  CREATE INDEX "_podcast_episodes_v_version_version_created_at_idx" ON "_podcast_episodes_v" USING btree ("version_created_at");
  CREATE INDEX "_podcast_episodes_v_version_version__status_idx" ON "_podcast_episodes_v" USING btree ("version__status");
  CREATE INDEX "_podcast_episodes_v_created_at_idx" ON "_podcast_episodes_v" USING btree ("created_at");
  CREATE INDEX "_podcast_episodes_v_updated_at_idx" ON "_podcast_episodes_v" USING btree ("updated_at");
  CREATE INDEX "_podcast_episodes_v_latest_idx" ON "_podcast_episodes_v" USING btree ("latest");
  CREATE INDEX "podcast_page_cta_cards_order_idx" ON "podcast_page_cta_cards" USING btree ("_order");
  CREATE INDEX "podcast_page_cta_cards_parent_id_idx" ON "podcast_page_cta_cards" USING btree ("_parent_id");
  CREATE INDEX "podcast_page_featured_hero_episode_idx" ON "podcast_page" USING btree ("featured_hero_episode_id");
  CREATE INDEX "_podcast_page_v_version_cta_cards_order_idx" ON "_podcast_page_v_version_cta_cards" USING btree ("_order");
  CREATE INDEX "_podcast_page_v_version_cta_cards_parent_id_idx" ON "_podcast_page_v_version_cta_cards" USING btree ("_parent_id");
  CREATE INDEX "_podcast_page_v_version_version_featured_hero_episode_idx" ON "_podcast_page_v" USING btree ("version_featured_hero_episode_id");
  CREATE INDEX "_podcast_page_v_created_at_idx" ON "_podcast_page_v" USING btree ("created_at");
  CREATE INDEX "_podcast_page_v_updated_at_idx" ON "_podcast_page_v" USING btree ("updated_at");
  ALTER TABLE "news" ADD CONSTRAINT "news_publisher_logo_id_media_id_fk" FOREIGN KEY ("publisher_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_publisher_logo_id_media_id_fk" FOREIGN KEY ("version_publisher_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_preview_audit_fk" FOREIGN KEY ("preview_audit_id") REFERENCES "public"."preview_audit"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcast_episodes_fk" FOREIGN KEY ("podcast_episodes_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "blogs_display_published_at_idx" ON "blogs" USING btree ("display_published_at");
  CREATE INDEX "_blogs_v_version_version_display_published_at_idx" ON "_blogs_v" USING btree ("version_display_published_at");
  CREATE INDEX "news_publisher_logo_idx" ON "news" USING btree ("publisher_logo_id");
  CREATE INDEX "_news_v_version_version_publisher_logo_idx" ON "_news_v" USING btree ("version_publisher_logo_id");
  CREATE INDEX "guides_display_published_at_idx" ON "guides" USING btree ("display_published_at");
  CREATE INDEX "_guides_v_version_version_display_published_at_idx" ON "_guides_v" USING btree ("version_display_published_at");
  CREATE INDEX "resources_display_published_at_idx" ON "resources" USING btree ("display_published_at");
  CREATE INDEX "_resources_v_version_version_display_published_at_idx" ON "_resources_v" USING btree ("version_display_published_at");
  CREATE INDEX "knowledge_base_display_published_at_idx" ON "knowledge_base" USING btree ("display_published_at");
  CREATE INDEX "_knowledge_base_v_version_version_display_published_at_idx" ON "_knowledge_base_v" USING btree ("version_display_published_at");
  CREATE INDEX "webinars_display_published_at_idx" ON "webinars" USING btree ("display_published_at");
  CREATE INDEX "_webinars_v_version_version_display_published_at_idx" ON "_webinars_v" USING btree ("version_display_published_at");
  CREATE INDEX "jobs_display_published_at_idx" ON "jobs" USING btree ("display_published_at");
  CREATE INDEX "_jobs_v_version_version_display_published_at_idx" ON "_jobs_v" USING btree ("version_display_published_at");
  CREATE INDEX "pages_display_published_at_idx" ON "pages" USING btree ("display_published_at");
  CREATE INDEX "_pages_v_version_version_display_published_at_idx" ON "_pages_v" USING btree ("version_display_published_at");
  CREATE INDEX "payload_locked_documents_rels_preview_audit_id_idx" ON "payload_locked_documents_rels" USING btree ("preview_audit_id");
  CREATE INDEX "payload_locked_documents_rels_podcast_episodes_id_idx" ON "payload_locked_documents_rels" USING btree ("podcast_episodes_id");
  ALTER TABLE "pages_blocks_code_block" DROP COLUMN "filename";
  ALTER TABLE "_pages_v_blocks_code_block" DROP COLUMN "filename";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "preview_audit" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcast_episodes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_podcast_episodes_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcast_page_cta_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcast_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_podcast_page_v_version_cta_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_podcast_page_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "preview_audit" CASCADE;
  DROP TABLE "podcast_episodes" CASCADE;
  DROP TABLE "_podcast_episodes_v" CASCADE;
  DROP TABLE "podcast_page_cta_cards" CASCADE;
  DROP TABLE "podcast_page" CASCADE;
  DROP TABLE "_podcast_page_v_version_cta_cards" CASCADE;
  DROP TABLE "_podcast_page_v" CASCADE;
  ALTER TABLE "news" DROP CONSTRAINT "news_publisher_logo_id_media_id_fk";
  
  ALTER TABLE "_news_v" DROP CONSTRAINT "_news_v_version_publisher_logo_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_preview_audit_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_podcast_episodes_fk";
  
  ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('lead_deleted', 'lead_exported', 'dsar_export', 'dsar_erasure', 'schema_override_changed', 'user_disabled', 'content_reassigned');
  ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";
  ALTER TABLE "resources" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_resources_type";
  CREATE TYPE "public"."enum_resources_type" AS ENUM('whitepaper', 'report', 'brief', 'datasheet', 'case-study');
  ALTER TABLE "resources" ALTER COLUMN "type" SET DATA TYPE "public"."enum_resources_type" USING "type"::"public"."enum_resources_type";
  ALTER TABLE "_resources_v" ALTER COLUMN "version_type" SET DATA TYPE text;
  DROP TYPE "public"."enum__resources_v_version_type";
  CREATE TYPE "public"."enum__resources_v_version_type" AS ENUM('whitepaper', 'report', 'brief', 'datasheet', 'case-study');
  ALTER TABLE "_resources_v" ALTER COLUMN "version_type" SET DATA TYPE "public"."enum__resources_v_version_type" USING "version_type"::"public"."enum__resources_v_version_type";
  ALTER TABLE "webinars" ALTER COLUMN "region" SET DATA TYPE text;
  ALTER TABLE "webinars" ALTER COLUMN "region" SET DEFAULT 'Global'::text;
  DROP TYPE "public"."enum_webinars_region";
  CREATE TYPE "public"."enum_webinars_region" AS ENUM('Americas', 'EMEA', 'APAC', 'Global');
  ALTER TABLE "webinars" ALTER COLUMN "region" SET DEFAULT 'Global'::"public"."enum_webinars_region";
  ALTER TABLE "webinars" ALTER COLUMN "region" SET DATA TYPE "public"."enum_webinars_region" USING "region"::"public"."enum_webinars_region";
  ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DATA TYPE text;
  ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DEFAULT 'Global'::text;
  DROP TYPE "public"."enum__webinars_v_version_region";
  CREATE TYPE "public"."enum__webinars_v_version_region" AS ENUM('Americas', 'EMEA', 'APAC', 'Global');
  ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DEFAULT 'Global'::"public"."enum__webinars_v_version_region";
  ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DATA TYPE "public"."enum__webinars_v_version_region" USING "version_region"::"public"."enum__webinars_v_version_region";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'drainLeadQueue', 'purgeSearchLog', 'purgeLeadsPii', 'checkBrokenLinks', 'retryWebhook', 'meiliReindex', 'dashboardRefreshFrequent', 'dashboardRefreshDaily', 'analyticsCachePrune', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'drainLeadQueue', 'purgeSearchLog', 'purgeLeadsPii', 'checkBrokenLinks', 'retryWebhook', 'meiliReindex', 'dashboardRefreshFrequent', 'dashboardRefreshDaily', 'analyticsCachePrune', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "blogs_display_published_at_idx";
  DROP INDEX "_blogs_v_version_version_display_published_at_idx";
  DROP INDEX "news_publisher_logo_idx";
  DROP INDEX "_news_v_version_version_publisher_logo_idx";
  DROP INDEX "guides_display_published_at_idx";
  DROP INDEX "_guides_v_version_version_display_published_at_idx";
  DROP INDEX "resources_display_published_at_idx";
  DROP INDEX "_resources_v_version_version_display_published_at_idx";
  DROP INDEX "knowledge_base_display_published_at_idx";
  DROP INDEX "_knowledge_base_v_version_version_display_published_at_idx";
  DROP INDEX "webinars_display_published_at_idx";
  DROP INDEX "_webinars_v_version_version_display_published_at_idx";
  DROP INDEX "jobs_display_published_at_idx";
  DROP INDEX "_jobs_v_version_version_display_published_at_idx";
  DROP INDEX "pages_display_published_at_idx";
  DROP INDEX "_pages_v_version_version_display_published_at_idx";
  DROP INDEX "payload_locked_documents_rels_preview_audit_id_idx";
  DROP INDEX "payload_locked_documents_rels_podcast_episodes_id_idx";
  ALTER TABLE "pages_blocks_code_block" ADD COLUMN "filename" varchar;
  ALTER TABLE "_pages_v_blocks_code_block" ADD COLUMN "filename" varchar;
  ALTER TABLE "blogs" DROP COLUMN "display_published_at";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_display_published_at";
  ALTER TABLE "news" DROP COLUMN "publisher";
  ALTER TABLE "news" DROP COLUMN "publisher_logo_id";
  ALTER TABLE "news" DROP COLUMN "press_type";
  ALTER TABLE "news" DROP COLUMN "location";
  ALTER TABLE "_news_v" DROP COLUMN "version_publisher";
  ALTER TABLE "_news_v" DROP COLUMN "version_publisher_logo_id";
  ALTER TABLE "_news_v" DROP COLUMN "version_press_type";
  ALTER TABLE "_news_v" DROP COLUMN "version_location";
  ALTER TABLE "guides" DROP COLUMN "display_published_at";
  ALTER TABLE "_guides_v" DROP COLUMN "version_display_published_at";
  ALTER TABLE "resources" DROP COLUMN "display_published_at";
  ALTER TABLE "_resources_v" DROP COLUMN "version_display_published_at";
  ALTER TABLE "knowledge_base" DROP COLUMN "display_published_at";
  ALTER TABLE "_knowledge_base_v" DROP COLUMN "version_display_published_at";
  ALTER TABLE "events" DROP COLUMN "cta_label";
  ALTER TABLE "events" DROP COLUMN "post_event_cta_enabled";
  ALTER TABLE "events" DROP COLUMN "post_event_cta_label";
  ALTER TABLE "events" DROP COLUMN "post_event_cta_url";
  ALTER TABLE "_events_v" DROP COLUMN "version_cta_label";
  ALTER TABLE "_events_v" DROP COLUMN "version_post_event_cta_enabled";
  ALTER TABLE "_events_v" DROP COLUMN "version_post_event_cta_label";
  ALTER TABLE "_events_v" DROP COLUMN "version_post_event_cta_url";
  ALTER TABLE "webinars" DROP COLUMN "display_published_at";
  ALTER TABLE "_webinars_v" DROP COLUMN "version_display_published_at";
  ALTER TABLE "jobs" DROP COLUMN "display_published_at";
  ALTER TABLE "_jobs_v" DROP COLUMN "version_display_published_at";
  ALTER TABLE "pages" DROP COLUMN "display_published_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_display_published_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "preview_audit_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "podcast_episodes_id";
  DROP TYPE "public"."enum_news_press_type";
  DROP TYPE "public"."enum__news_v_version_press_type";
  DROP TYPE "public"."enum_podcast_episodes_status";
  DROP TYPE "public"."enum__podcast_episodes_v_version_status";`)
}
