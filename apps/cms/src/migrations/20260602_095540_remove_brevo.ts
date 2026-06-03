import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "integrations" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_integrations_kind";
  CREATE TYPE "public"."enum_integrations_kind" AS ENUM('teamsWorkflow', 'genericWebhook', 'hubspotCrm', 'ga4DataApi', 'gscSearchAnalyticsApi', 'gscUrlInspectionApi', 'msClarity', 'cloudflareWebAnalytics', 'calComInbound', 'zohoCrm');
  ALTER TABLE "integrations" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_integrations_kind" USING "kind"::"public"."enum_integrations_kind";
  ALTER TABLE "leads" DROP COLUMN "email_health";
  ALTER TABLE "leads" DROP COLUMN "email_health_at";
  DROP TYPE "public"."enum_leads_email_health";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_email_health" AS ENUM('good', 'soft_bounce', 'hard_bounce', 'complaint', 'unsubscribed');
  ALTER TYPE "public"."enum_integrations_kind" ADD VALUE 'brevoBounceCallback' BEFORE 'zohoCrm';
  ALTER TABLE "leads" ADD COLUMN "email_health" "enum_leads_email_health" DEFAULT 'good';
  ALTER TABLE "leads" ADD COLUMN "email_health_at" timestamp(3) with time zone;`)
}
