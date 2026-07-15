import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the `attribution` group to the `leads` collection: a server-derived
// marketing `channel`, `device`, ad click IDs (gclid / fbclid / liFatId), and
// a nested `firstTouch` group capturing the campaign + landing page from the
// visitor's first session. The existing `utm_*` columns stay as last-touch.
// Leads is append-only and unversioned, so there is no `_leads_v` table to mirror.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_leads_attribution_channel" AS ENUM('paid_search', 'paid_social', 'organic_search', 'social', 'email', 'referral', 'direct', 'other');
  CREATE TYPE "public"."enum_leads_attribution_device" AS ENUM('desktop', 'mobile', 'tablet');
  ALTER TABLE "leads" ADD COLUMN "attribution_channel" "enum_leads_attribution_channel";
  ALTER TABLE "leads" ADD COLUMN "attribution_device" "enum_leads_attribution_device";
  ALTER TABLE "leads" ADD COLUMN "attribution_gclid" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_fbclid" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_li_fat_id" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_first_touch_source" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_first_touch_medium" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_first_touch_campaign" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_first_touch_term" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_first_touch_content" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_first_touch_landing_page" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_first_touch_referrer" varchar;
  ALTER TABLE "leads" ADD COLUMN "attribution_first_touch_at" timestamp(3) with time zone;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "leads" DROP COLUMN "attribution_channel";
  ALTER TABLE "leads" DROP COLUMN "attribution_device";
  ALTER TABLE "leads" DROP COLUMN "attribution_gclid";
  ALTER TABLE "leads" DROP COLUMN "attribution_fbclid";
  ALTER TABLE "leads" DROP COLUMN "attribution_li_fat_id";
  ALTER TABLE "leads" DROP COLUMN "attribution_first_touch_source";
  ALTER TABLE "leads" DROP COLUMN "attribution_first_touch_medium";
  ALTER TABLE "leads" DROP COLUMN "attribution_first_touch_campaign";
  ALTER TABLE "leads" DROP COLUMN "attribution_first_touch_term";
  ALTER TABLE "leads" DROP COLUMN "attribution_first_touch_content";
  ALTER TABLE "leads" DROP COLUMN "attribution_first_touch_landing_page";
  ALTER TABLE "leads" DROP COLUMN "attribution_first_touch_referrer";
  ALTER TABLE "leads" DROP COLUMN "attribution_first_touch_at";
  DROP TYPE "public"."enum_leads_attribution_channel";
  DROP TYPE "public"."enum_leads_attribution_device";`)
}
