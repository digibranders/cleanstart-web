import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `advisories` collection (security advisories, listed at
 * /advisories). Versioned with drafts, so every table has a `_advisories_v`
 * mirror; the `blocks_*` tables back the shared SEO schema-addons field.
 *
 * Outside the new tables it touches three things:
 *   - `payload_locked_documents_rels.advisories_id`: Payload loads that whole
 *     row on any document-lock read, so leaving it out breaks every
 *     collection's list and edit view (the 2026-06-24 taxonomy incident).
 *   - `pages_rels` / `_pages_v_rels.advisories_id`: the shared link field can
 *     now target an advisory.
 *   - `enum_integrations_routing_collections` gains 'advisories'.
 *
 * Hand-written rather than generated, for the reason in
 * `20260921_100000_add_case_study_detail_fields.ts`. The DDL was transcribed
 * from the schema Payload pushed onto a scratch clone of a dev database and
 * checked by applying this file to a second clone: tables, columns, defaults,
 * enums, indexes and constraints matched the push exactly.
 *
 * Idempotent throughout: local databases run `push: true` and already have
 * these objects.
 */

const UP = [
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_version_toc_depth" AS ENUM('h2', 'h2_h3', 'h2_h3_h4'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_blocks_breadcrumb_list_mode" AS ENUM('suppress', 'replace'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_blocks_review_item_reviewed_type" AS ENUM('Product', 'Service', 'SoftwareApplication', 'Organization'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_blocks_software_app_category" AS ENUM('BusinessApplication', 'DeveloperApplication', 'SecurityApplication', 'CommunicationApplication'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_blocks_software_app_currency" AS ENUM('USD', 'EUR', 'GBP', 'INR'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_seo_twitter_card" AS ENUM('summary', 'summary_large_image'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_toc_depth" AS ENUM('h2', 'h2_h3', 'h2_h3_h4'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`ALTER TYPE "public"."enum_integrations_routing_collections" ADD VALUE IF NOT EXISTS 'advisories';`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_abstract" varchar,
  	"version_hero_image_id" integer,
  	"version_body" jsonb,
  	"version_reviewed_by_id" integer,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_published_at" timestamp(3) with time zone,
  	"version_content_updated_at" timestamp(3) with time zone,
  	"version_reading_minutes" numeric,
  	"version_word_count" numeric,
  	"version_toc_depth" "public"."enum__advisories_v_version_toc_depth" DEFAULT 'h2',
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_indexable" "public"."enum__advisories_v_version_seo_indexable" DEFAULT 'index',
  	"version_seo_og_image_id" integer,
  	"version_seo_og_image_alt" varchar,
  	"version_seo_use_advanced_og" boolean DEFAULT false,
  	"version_seo_og_title" varchar,
  	"version_seo_og_description" varchar,
  	"version_seo_use_advanced_twitter" boolean DEFAULT false,
  	"version_seo_twitter_card" "public"."enum__advisories_v_version_seo_twitter_card" DEFAULT 'summary_large_image',
  	"version_seo_twitter_title" varchar,
  	"version_seo_twitter_description" varchar,
  	"version_seo_twitter_image_id" integer,
  	"version_seo_use_custom_canonical" boolean DEFAULT false,
  	"version_seo_canonical_override" varchar,
  	"version_seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"version_seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"version_seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"version_seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"version_seo_robots_advanced_max_snippet" numeric,
  	"version_seo_robots_advanced_max_image_preview" "public"."enum_seo_max_image_preview",
  	"version_seo_robots_advanced_max_video_preview" numeric,
  	"version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"version_seo_alternates" jsonb,
  	"version_seo_custom_tags" jsonb,
  	"version_seo_keyword_target" varchar,
  	"version_seo_keywords" jsonb,
  	"version_seo_additional_schema" jsonb,
  	"version_seo_schema_history" jsonb,
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "public"."enum__advisories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "public"."enum__advisories_v_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"_uuid" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar,
  	"_uuid" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "public"."enum__advisories_v_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "public"."enum__advisories_v_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "public"."enum__advisories_v_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"_uuid" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_version_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"_uuid" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_version_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selector" varchar,
  	"_uuid" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_version_table_of_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"anchor" varchar,
  	"_uuid" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"abstract" varchar,
  	"hero_image_id" integer,
  	"body" jsonb,
  	"reviewed_by_id" integer,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"display_published_at" timestamp(3) with time zone,
  	"content_updated_at" timestamp(3) with time zone,
  	"reading_minutes" numeric,
  	"word_count" numeric,
  	"toc_depth" "public"."enum_advisories_toc_depth" DEFAULT 'h2',
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_indexable" "public"."enum_advisories_seo_indexable" DEFAULT 'index',
  	"seo_og_image_id" integer,
  	"seo_og_image_alt" varchar,
  	"seo_use_advanced_og" boolean DEFAULT false,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_use_advanced_twitter" boolean DEFAULT false,
  	"seo_twitter_card" "public"."enum_advisories_seo_twitter_card" DEFAULT 'summary_large_image',
  	"seo_twitter_title" varchar,
  	"seo_twitter_description" varchar,
  	"seo_twitter_image_id" integer,
  	"seo_use_custom_canonical" boolean DEFAULT false,
  	"seo_canonical_override" varchar,
  	"seo_robots_advanced_noarchive" boolean DEFAULT false,
  	"seo_robots_advanced_nosnippet" boolean DEFAULT false,
  	"seo_robots_advanced_noimageindex" boolean DEFAULT false,
  	"seo_robots_advanced_notranslate" boolean DEFAULT false,
  	"seo_robots_advanced_max_snippet" numeric,
  	"seo_robots_advanced_max_image_preview" "public"."enum_seo_max_image_preview",
  	"seo_robots_advanced_max_video_preview" numeric,
  	"seo_robots_advanced_unavailable_after" timestamp(3) with time zone,
  	"seo_alternates" jsonb,
  	"seo_custom_tags" jsonb,
  	"seo_keyword_target" varchar,
  	"seo_keywords" jsonb,
  	"seo_additional_schema" jsonb,
  	"seo_schema_history" jsonb,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "public"."enum_advisories_status" DEFAULT 'draft'
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_breadcrumb_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "public"."enum_advisories_blocks_breadcrumb_list_mode" DEFAULT 'suppress',
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_breadcrumb_list_crumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"path" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_faq_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_faq_page_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_how_to" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"total_time" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"image_id" integer
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_review" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_reviewed_type" "public"."enum_advisories_blocks_review_item_reviewed_type" DEFAULT 'Product',
  	"item_reviewed_name" varchar,
  	"rating_value" numeric,
  	"review_body" varchar,
  	"author_name" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_software_app" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"category" "public"."enum_advisories_blocks_software_app_category" DEFAULT 'BusinessApplication',
  	"os" varchar,
  	"price" varchar,
  	"currency" "public"."enum_advisories_blocks_software_app_currency" DEFAULT 'USD',
  	"rating_value" numeric,
  	"rating_count" numeric,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_blocks_video_object" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" varchar,
  	"thumbnail_id" integer,
  	"upload_date" timestamp(3) with time zone,
  	"content_url" varchar,
  	"embed_url" varchar,
  	"duration" varchar,
  	"block_name" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_seo_speakable_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selector" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_table_of_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"anchor" varchar
  );`,
  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "advisories_id" integer;`,
  sql`ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "advisories_id" integer;`,
  sql`ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "advisories_id" integer;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v" ADD CONSTRAINT "_advisories_v_parent_id_advisories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."advisories"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v" ADD CONSTRAINT "_advisories_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v" ADD CONSTRAINT "_advisories_v_version_reviewed_by_id_authors_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v" ADD CONSTRAINT "_advisories_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v" ADD CONSTRAINT "_advisories_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_breadcrumb_list" ADD CONSTRAINT "_advisories_v_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "_advisories_v_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_faq_page" ADD CONSTRAINT "_advisories_v_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_faq_page_questions" ADD CONSTRAINT "_advisories_v_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_how_to" ADD CONSTRAINT "_advisories_v_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_how_to_steps" ADD CONSTRAINT "_advisories_v_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_how_to_steps" ADD CONSTRAINT "_advisories_v_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_review" ADD CONSTRAINT "_advisories_v_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_software_app" ADD CONSTRAINT "_advisories_v_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_video_object" ADD CONSTRAINT "_advisories_v_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_blocks_video_object" ADD CONSTRAINT "_advisories_v_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_rels" ADD CONSTRAINT "_advisories_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_rels" ADD CONSTRAINT "_advisories_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_version_faqs" ADD CONSTRAINT "_advisories_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_version_seo_speakable_path" ADD CONSTRAINT "_advisories_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_version_table_of_contents" ADD CONSTRAINT "_advisories_v_version_table_of_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_advisories_fk" FOREIGN KEY ("advisories_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories" ADD CONSTRAINT "advisories_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories" ADD CONSTRAINT "advisories_reviewed_by_id_authors_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories" ADD CONSTRAINT "advisories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories" ADD CONSTRAINT "advisories_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_breadcrumb_list" ADD CONSTRAINT "advisories_blocks_breadcrumb_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_breadcrumb_list_crumbs" ADD CONSTRAINT "advisories_blocks_breadcrumb_list_crumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories_blocks_breadcrumb_list"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_faq_page" ADD CONSTRAINT "advisories_blocks_faq_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_faq_page_questions" ADD CONSTRAINT "advisories_blocks_faq_page_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories_blocks_faq_page"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_how_to" ADD CONSTRAINT "advisories_blocks_how_to_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_how_to_steps" ADD CONSTRAINT "advisories_blocks_how_to_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_how_to_steps" ADD CONSTRAINT "advisories_blocks_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories_blocks_how_to"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_review" ADD CONSTRAINT "advisories_blocks_review_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_software_app" ADD CONSTRAINT "advisories_blocks_software_app_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_video_object" ADD CONSTRAINT "advisories_blocks_video_object_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_blocks_video_object" ADD CONSTRAINT "advisories_blocks_video_object_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_faqs" ADD CONSTRAINT "advisories_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_rels" ADD CONSTRAINT "advisories_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_rels" ADD CONSTRAINT "advisories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_seo_speakable_path" ADD CONSTRAINT "advisories_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_table_of_contents" ADD CONSTRAINT "advisories_table_of_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_advisories_fk" FOREIGN KEY ("advisories_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_advisories_fk" FOREIGN KEY ("advisories_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_created_at_idx" ON "_advisories_v" USING btree ("created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_latest_idx" ON "_advisories_v" USING btree ("latest");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_parent_idx" ON "_advisories_v" USING btree ("parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_updated_at_idx" ON "_advisories_v" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_seo_version_seo_og_image_idx" ON "_advisories_v" USING btree ("version_seo_og_image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_seo_version_seo_twitter_image_idx" ON "_advisories_v" USING btree ("version_seo_twitter_image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_version__status_idx" ON "_advisories_v" USING btree ("version__status");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_version_created_at_idx" ON "_advisories_v" USING btree ("version_created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_version_display_published_at_idx" ON "_advisories_v" USING btree ("version_display_published_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_version_hero_image_idx" ON "_advisories_v" USING btree ("version_hero_image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_version_reviewed_by_idx" ON "_advisories_v" USING btree ("version_reviewed_by_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_version_slug_idx" ON "_advisories_v" USING btree ("version_slug");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_version_updated_at_idx" ON "_advisories_v" USING btree ("version_updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_breadcrumb_list_order_idx" ON "_advisories_v_blocks_breadcrumb_list" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_breadcrumb_list_parent_id_idx" ON "_advisories_v_blocks_breadcrumb_list" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_breadcrumb_list_path_idx" ON "_advisories_v_blocks_breadcrumb_list" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_breadcrumb_list_crumbs_order_idx" ON "_advisories_v_blocks_breadcrumb_list_crumbs" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "_advisories_v_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_faq_page_order_idx" ON "_advisories_v_blocks_faq_page" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_faq_page_parent_id_idx" ON "_advisories_v_blocks_faq_page" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_faq_page_path_idx" ON "_advisories_v_blocks_faq_page" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_faq_page_questions_order_idx" ON "_advisories_v_blocks_faq_page_questions" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_faq_page_questions_parent_id_idx" ON "_advisories_v_blocks_faq_page_questions" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_how_to_order_idx" ON "_advisories_v_blocks_how_to" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_how_to_parent_id_idx" ON "_advisories_v_blocks_how_to" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_how_to_path_idx" ON "_advisories_v_blocks_how_to" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_how_to_steps_image_idx" ON "_advisories_v_blocks_how_to_steps" USING btree ("image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_how_to_steps_order_idx" ON "_advisories_v_blocks_how_to_steps" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_how_to_steps_parent_id_idx" ON "_advisories_v_blocks_how_to_steps" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_review_order_idx" ON "_advisories_v_blocks_review" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_review_parent_id_idx" ON "_advisories_v_blocks_review" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_review_path_idx" ON "_advisories_v_blocks_review" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_software_app_order_idx" ON "_advisories_v_blocks_software_app" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_software_app_parent_id_idx" ON "_advisories_v_blocks_software_app" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_software_app_path_idx" ON "_advisories_v_blocks_software_app" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_video_object_order_idx" ON "_advisories_v_blocks_video_object" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_video_object_parent_id_idx" ON "_advisories_v_blocks_video_object" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_video_object_path_idx" ON "_advisories_v_blocks_video_object" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_blocks_video_object_thumbnail_idx" ON "_advisories_v_blocks_video_object" USING btree ("thumbnail_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_rels_authors_id_idx" ON "_advisories_v_rels" USING btree ("authors_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_rels_order_idx" ON "_advisories_v_rels" USING btree ("order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_rels_parent_idx" ON "_advisories_v_rels" USING btree ("parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_rels_path_idx" ON "_advisories_v_rels" USING btree ("path");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_faqs_order_idx" ON "_advisories_v_version_faqs" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_faqs_parent_id_idx" ON "_advisories_v_version_faqs" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_seo_speakable_path_order_idx" ON "_advisories_v_version_seo_speakable_path" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_seo_speakable_path_parent_id_idx" ON "_advisories_v_version_seo_speakable_path" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_table_of_contents_order_idx" ON "_advisories_v_version_table_of_contents" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_table_of_contents_parent_id_idx" ON "_advisories_v_version_table_of_contents" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_pages_v_rels_advisories_id_idx" ON "_pages_v_rels" USING btree ("advisories_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories__status_idx" ON "advisories" USING btree ("_status");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_created_at_idx" ON "advisories" USING btree ("created_at");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_display_published_at_idx" ON "advisories" USING btree ("display_published_at");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_hero_image_idx" ON "advisories" USING btree ("hero_image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_reviewed_by_idx" ON "advisories" USING btree ("reviewed_by_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_seo_seo_og_image_idx" ON "advisories" USING btree ("seo_og_image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_seo_seo_twitter_image_idx" ON "advisories" USING btree ("seo_twitter_image_id");`,
  sql`CREATE UNIQUE INDEX IF NOT EXISTS "advisories_slug_idx" ON "advisories" USING btree ("slug");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_updated_at_idx" ON "advisories" USING btree ("updated_at");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_breadcrumb_list_order_idx" ON "advisories_blocks_breadcrumb_list" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_breadcrumb_list_parent_id_idx" ON "advisories_blocks_breadcrumb_list" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_breadcrumb_list_path_idx" ON "advisories_blocks_breadcrumb_list" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_breadcrumb_list_crumbs_order_idx" ON "advisories_blocks_breadcrumb_list_crumbs" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_breadcrumb_list_crumbs_parent_id_idx" ON "advisories_blocks_breadcrumb_list_crumbs" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_faq_page_order_idx" ON "advisories_blocks_faq_page" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_faq_page_parent_id_idx" ON "advisories_blocks_faq_page" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_faq_page_path_idx" ON "advisories_blocks_faq_page" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_faq_page_questions_order_idx" ON "advisories_blocks_faq_page_questions" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_faq_page_questions_parent_id_idx" ON "advisories_blocks_faq_page_questions" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_how_to_order_idx" ON "advisories_blocks_how_to" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_how_to_parent_id_idx" ON "advisories_blocks_how_to" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_how_to_path_idx" ON "advisories_blocks_how_to" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_how_to_steps_image_idx" ON "advisories_blocks_how_to_steps" USING btree ("image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_how_to_steps_order_idx" ON "advisories_blocks_how_to_steps" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_how_to_steps_parent_id_idx" ON "advisories_blocks_how_to_steps" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_review_order_idx" ON "advisories_blocks_review" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_review_parent_id_idx" ON "advisories_blocks_review" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_review_path_idx" ON "advisories_blocks_review" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_software_app_order_idx" ON "advisories_blocks_software_app" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_software_app_parent_id_idx" ON "advisories_blocks_software_app" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_software_app_path_idx" ON "advisories_blocks_software_app" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_video_object_order_idx" ON "advisories_blocks_video_object" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_video_object_parent_id_idx" ON "advisories_blocks_video_object" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_video_object_path_idx" ON "advisories_blocks_video_object" USING btree ("_path");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_blocks_video_object_thumbnail_idx" ON "advisories_blocks_video_object" USING btree ("thumbnail_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_faqs_order_idx" ON "advisories_faqs" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_faqs_parent_id_idx" ON "advisories_faqs" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_rels_authors_id_idx" ON "advisories_rels" USING btree ("authors_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_rels_order_idx" ON "advisories_rels" USING btree ("order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_rels_parent_idx" ON "advisories_rels" USING btree ("parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_rels_path_idx" ON "advisories_rels" USING btree ("path");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_seo_speakable_path_order_idx" ON "advisories_seo_speakable_path" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_seo_speakable_path_parent_id_idx" ON "advisories_seo_speakable_path" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_table_of_contents_order_idx" ON "advisories_table_of_contents" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_table_of_contents_parent_id_idx" ON "advisories_table_of_contents" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "pages_rels_advisories_id_idx" ON "pages_rels" USING btree ("advisories_id");`,
  sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_advisories_id_idx" ON "payload_locked_documents_rels" USING btree ("advisories_id");`,
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "advisories_id";`)
  await db.execute(sql`ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "advisories_id";`)
  await db.execute(sql`ALTER TABLE "_pages_v_rels" DROP COLUMN IF EXISTS "advisories_id";`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_breadcrumb_list" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_breadcrumb_list_crumbs" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_faq_page" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_faq_page_questions" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_how_to" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_how_to_steps" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_review" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_software_app" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_blocks_video_object" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_rels" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_version_faqs" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_version_seo_speakable_path" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_version_table_of_contents" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_breadcrumb_list" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_breadcrumb_list_crumbs" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_faq_page" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_faq_page_questions" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_how_to" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_how_to_steps" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_review" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_software_app" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_blocks_video_object" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_faqs" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_rels" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_seo_speakable_path" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_table_of_contents" CASCADE;`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_blocks_breadcrumb_list_mode";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_blocks_review_item_reviewed_type";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_blocks_software_app_category";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_blocks_software_app_currency";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_version_seo_indexable";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_version_seo_twitter_card";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_version_status";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_version_toc_depth";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_blocks_breadcrumb_list_mode";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_blocks_review_item_reviewed_type";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_blocks_software_app_category";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_blocks_software_app_currency";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_seo_indexable";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_seo_twitter_card";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_status";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_toc_depth";`)
  // Postgres cannot drop a single enum label, so 'advisories' stays on
  // enum_integrations_routing_collections. Unused labels are harmless.
}
