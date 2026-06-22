import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Removes the `podcastPage` global entirely — all /podcast layout, headings and
// copy now live in apps/web code. The CMS owns only the `podcastEpisodes`
// collection (videos + content). A new `hero_episode` flag on that collection
// designates which episode is the embedded hero video (the Introduction), so the
// hero is curated from the collection rather than a separate global.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "podcast_episodes" ADD COLUMN "hero_episode" boolean DEFAULT false;
  ALTER TABLE "_podcast_episodes_v" ADD COLUMN "version_hero_episode" boolean DEFAULT false;
  DROP TABLE "podcast_page_cta_cards" CASCADE;
  DROP TABLE "podcast_page" CASCADE;
  DROP TABLE "_podcast_page_v_version_cta_cards" CASCADE;
  DROP TABLE "_podcast_page_v" CASCADE;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
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

  CREATE TABLE "podcast_page_cta_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL
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

  ALTER TABLE "podcast_page_cta_cards" ADD CONSTRAINT "podcast_page_cta_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."podcast_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcast_page" ADD CONSTRAINT "podcast_page_featured_hero_episode_id_podcast_episodes_id_fk" FOREIGN KEY ("featured_hero_episode_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_podcast_page_v_version_cta_cards" ADD CONSTRAINT "_podcast_page_v_version_cta_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_podcast_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_podcast_page_v" ADD CONSTRAINT "_podcast_page_v_version_featured_hero_episode_id_podcast_episodes_id_fk" FOREIGN KEY ("version_featured_hero_episode_id") REFERENCES "public"."podcast_episodes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "podcast_page_cta_cards_order_idx" ON "podcast_page_cta_cards" USING btree ("_order");
  CREATE INDEX "podcast_page_cta_cards_parent_id_idx" ON "podcast_page_cta_cards" USING btree ("_parent_id");
  CREATE INDEX "podcast_page_featured_hero_episode_idx" ON "podcast_page" USING btree ("featured_hero_episode_id");
  CREATE INDEX "_podcast_page_v_version_cta_cards_order_idx" ON "_podcast_page_v_version_cta_cards" USING btree ("_order");
  CREATE INDEX "_podcast_page_v_version_cta_cards_parent_id_idx" ON "_podcast_page_v_version_cta_cards" USING btree ("_parent_id");
  CREATE INDEX "_podcast_page_v_version_version_featured_hero_episode_idx" ON "_podcast_page_v" USING btree ("version_featured_hero_episode_id");
  CREATE INDEX "_podcast_page_v_created_at_idx" ON "_podcast_page_v" USING btree ("created_at");
  CREATE INDEX "_podcast_page_v_updated_at_idx" ON "_podcast_page_v" USING btree ("updated_at");

  ALTER TABLE "podcast_episodes" DROP COLUMN "hero_episode";
  ALTER TABLE "_podcast_episodes_v" DROP COLUMN "version_hero_episode";`)
}
