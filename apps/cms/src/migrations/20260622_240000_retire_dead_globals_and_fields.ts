import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Phase-2 cleanup: drop the dead mainNav/footerNav/announcements globals, strip
// the unused Legal content fields (privacy/terms/aup/dpaContactEmail — content
// lives in the legalDocuments collection; policyVersion kept for GDPR), and
// prune the never-read Site-settings sub-groups (listing/toc/leads/analytics).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- Retire dead globals: mainNav, footerNav, announcements (site hardcodes nav/footer; no banner).
  DROP TABLE IF EXISTS "_announcements_v" CASCADE;
  DROP TABLE IF EXISTS "_footer_nav_v" CASCADE;
  DROP TABLE IF EXISTS "_footer_nav_v_version_badges" CASCADE;
  DROP TABLE IF EXISTS "_footer_nav_v_version_columns" CASCADE;
  DROP TABLE IF EXISTS "_footer_nav_v_version_columns_items" CASCADE;
  DROP TABLE IF EXISTS "_footer_nav_v_version_legal_links" CASCADE;
  DROP TABLE IF EXISTS "_footer_nav_v_version_social" CASCADE;
  DROP TABLE IF EXISTS "_main_nav_v" CASCADE;
  DROP TABLE IF EXISTS "_main_nav_v_version_items" CASCADE;
  DROP TABLE IF EXISTS "_main_nav_v_version_items_mega_menu_columns" CASCADE;
  DROP TABLE IF EXISTS "_main_nav_v_version_items_mega_menu_columns_items" CASCADE;
  DROP TABLE IF EXISTS "announcements" CASCADE;
  DROP TABLE IF EXISTS "footer_nav" CASCADE;
  DROP TABLE IF EXISTS "footer_nav_badges" CASCADE;
  DROP TABLE IF EXISTS "footer_nav_columns" CASCADE;
  DROP TABLE IF EXISTS "footer_nav_columns_items" CASCADE;
  DROP TABLE IF EXISTS "footer_nav_legal_links" CASCADE;
  DROP TABLE IF EXISTS "footer_nav_social" CASCADE;
  DROP TABLE IF EXISTS "main_nav" CASCADE;
  DROP TABLE IF EXISTS "main_nav_items" CASCADE;
  DROP TABLE IF EXISTS "main_nav_items_mega_menu_columns" CASCADE;
  DROP TABLE IF EXISTS "main_nav_items_mega_menu_columns_items" CASCADE;
  -- Strip unused Legal content fields (content lives in legalDocuments collection); keep policy_version.
  ALTER TABLE "legal" DROP COLUMN IF EXISTS "privacy";
  ALTER TABLE "legal" DROP COLUMN IF EXISTS "terms";
  ALTER TABLE "legal" DROP COLUMN IF EXISTS "aup";
  ALTER TABLE "legal" DROP COLUMN IF EXISTS "dpa_contact_email";
  ALTER TABLE "_legal_v" DROP COLUMN IF EXISTS "version_privacy";
  ALTER TABLE "_legal_v" DROP COLUMN IF EXISTS "version_terms";
  ALTER TABLE "_legal_v" DROP COLUMN IF EXISTS "version_aup";
  ALTER TABLE "_legal_v" DROP COLUMN IF EXISTS "version_dpa_contact_email";
  -- Prune unused Site settings sub-groups (listing/toc/leads/analytics).
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "listing_page_size";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "listing_pagination_indexable_depth";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "toc_min_headings";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "toc_max_depth";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "leads_retention_days";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "analytics_gtm_container_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "analytics_ga4_measurement_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "analytics_consent_mode_enabled";
  ALTER TABLE "_site_settings_v" DROP COLUMN IF EXISTS "version_listing_page_size";
  ALTER TABLE "_site_settings_v" DROP COLUMN IF EXISTS "version_listing_pagination_indexable_depth";
  ALTER TABLE "_site_settings_v" DROP COLUMN IF EXISTS "version_toc_min_headings";
  ALTER TABLE "_site_settings_v" DROP COLUMN IF EXISTS "version_toc_max_depth";
  ALTER TABLE "_site_settings_v" DROP COLUMN IF EXISTS "version_leads_retention_days";
  ALTER TABLE "_site_settings_v" DROP COLUMN IF EXISTS "version_analytics_gtm_container_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN IF EXISTS "version_analytics_ga4_measurement_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN IF EXISTS "version_analytics_consent_mode_enabled";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- Reversible part: re-add the stripped Legal + Site-settings columns.
  ALTER TABLE "legal" ADD COLUMN IF NOT EXISTS "privacy" jsonb;
  ALTER TABLE "legal" ADD COLUMN IF NOT EXISTS "terms" jsonb;
  ALTER TABLE "legal" ADD COLUMN IF NOT EXISTS "aup" jsonb;
  ALTER TABLE "legal" ADD COLUMN IF NOT EXISTS "dpa_contact_email" varchar;
  ALTER TABLE "_legal_v" ADD COLUMN IF NOT EXISTS "version_privacy" jsonb;
  ALTER TABLE "_legal_v" ADD COLUMN IF NOT EXISTS "version_terms" jsonb;
  ALTER TABLE "_legal_v" ADD COLUMN IF NOT EXISTS "version_aup" jsonb;
  ALTER TABLE "_legal_v" ADD COLUMN IF NOT EXISTS "version_dpa_contact_email" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "listing_page_size" numeric;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "listing_pagination_indexable_depth" numeric;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "toc_min_headings" numeric;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "toc_max_depth" numeric;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "leads_retention_days" numeric;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "analytics_gtm_container_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "analytics_ga4_measurement_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "analytics_consent_mode_enabled" boolean;
  ALTER TABLE "_site_settings_v" ADD COLUMN IF NOT EXISTS "version_listing_page_size" numeric;
  ALTER TABLE "_site_settings_v" ADD COLUMN IF NOT EXISTS "version_listing_pagination_indexable_depth" numeric;
  ALTER TABLE "_site_settings_v" ADD COLUMN IF NOT EXISTS "version_toc_min_headings" numeric;
  ALTER TABLE "_site_settings_v" ADD COLUMN IF NOT EXISTS "version_toc_max_depth" numeric;
  ALTER TABLE "_site_settings_v" ADD COLUMN IF NOT EXISTS "version_leads_retention_days" numeric;
  ALTER TABLE "_site_settings_v" ADD COLUMN IF NOT EXISTS "version_analytics_gtm_container_id" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN IF NOT EXISTS "version_analytics_ga4_measurement_id" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN IF NOT EXISTS "version_analytics_consent_mode_enabled" boolean;
  -- NOTE: the three retired globals (mainNav/footerNav/announcements) are NOT
  -- recreated here — they were dead. Restore from a pre-migration DB backup if
  -- a rollback that needs them is ever required.`)
}
