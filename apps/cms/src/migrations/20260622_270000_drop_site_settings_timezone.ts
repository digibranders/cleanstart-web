import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Remove the unused siteSettings.organizationTimezone field. The event/webinar
// "timezone fallback" it was meant for was never wired in code, and no endpoint
// reads it — only siteName/baseUrl/defaultLocale are consumed (robots/sitemap/jsonld).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "site_settings" DROP COLUMN "organization_timezone";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_organization_timezone";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "site_settings" ADD COLUMN "organization_timezone" varchar DEFAULT 'Asia/Kolkata';
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_organization_timezone" varchar DEFAULT 'Asia/Kolkata';`)
}
