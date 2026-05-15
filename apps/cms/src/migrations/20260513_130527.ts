import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_integrations_routing_collections" AS ENUM('blogs', 'news', 'guides', 'resources', 'knowledgeBase', 'events', 'webinars', 'jobs', 'pages');
  CREATE TYPE "public"."enum_integrations_hubspot_config_default_lifecycle_stage" AS ENUM('subscriber', 'lead', 'marketingqualifiedlead', 'salesqualifiedlead', 'opportunity', 'customer', 'evangelist', 'other');
  CREATE TYPE "public"."enum_integrations_hubspot_config_default_lead_status" AS ENUM('NEW', 'OPEN', 'IN_PROGRESS', 'OPEN_DEAL', 'UNQUALIFIED', 'ATTEMPTED_TO_CONTACT', 'CONNECTED', 'BAD_TIMING');
  CREATE TABLE "integrations_routing_collections" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_integrations_routing_collections",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "blogs_rels" DROP CONSTRAINT "blogs_rels_categories_fk";
  
  ALTER TABLE "_blogs_v_rels" DROP CONSTRAINT "_blogs_v_rels_categories_fk";
  
  DROP INDEX "blogs_rels_categories_id_idx";
  DROP INDEX "_blogs_v_rels_categories_id_idx";
  ALTER TABLE "integrations" ALTER COLUMN "hubspot_config_default_lifecycle_stage" SET DEFAULT 'lead'::"public"."enum_integrations_hubspot_config_default_lifecycle_stage";
  ALTER TABLE "integrations" ALTER COLUMN "hubspot_config_default_lifecycle_stage" SET DATA TYPE "public"."enum_integrations_hubspot_config_default_lifecycle_stage" USING "hubspot_config_default_lifecycle_stage"::"public"."enum_integrations_hubspot_config_default_lifecycle_stage";
  ALTER TABLE "integrations" ALTER COLUMN "hubspot_config_default_lead_status" SET DEFAULT 'NEW'::"public"."enum_integrations_hubspot_config_default_lead_status";
  ALTER TABLE "integrations" ALTER COLUMN "hubspot_config_default_lead_status" SET DATA TYPE "public"."enum_integrations_hubspot_config_default_lead_status" USING "hubspot_config_default_lead_status"::"public"."enum_integrations_hubspot_config_default_lead_status";
  ALTER TABLE "blogs" ADD COLUMN "categories_id" integer;
  ALTER TABLE "_blogs_v" ADD COLUMN "version_categories_id" integer;
  ALTER TABLE "integrations_routing_collections" ADD CONSTRAINT "integrations_routing_collections_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "integrations_routing_collections_order_idx" ON "integrations_routing_collections" USING btree ("order");
  CREATE INDEX "integrations_routing_collections_parent_idx" ON "integrations_routing_collections" USING btree ("parent_id");
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_categories_id_categories_id_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_categories_id_categories_id_fk" FOREIGN KEY ("version_categories_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "blogs_categories_idx" ON "blogs" USING btree ("categories_id");
  CREATE INDEX "_blogs_v_version_version_categories_idx" ON "_blogs_v" USING btree ("version_categories_id");
  ALTER TABLE "blogs_rels" DROP COLUMN "categories_id";
  ALTER TABLE "_blogs_v_rels" DROP COLUMN "categories_id";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "integrations_routing_collections" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "integrations_routing_collections" CASCADE;
  ALTER TABLE "blogs" DROP CONSTRAINT "blogs_categories_id_categories_id_fk";
  
  ALTER TABLE "_blogs_v" DROP CONSTRAINT "_blogs_v_version_categories_id_categories_id_fk";
  
  DROP INDEX "blogs_categories_idx";
  DROP INDEX "_blogs_v_version_version_categories_idx";
  ALTER TABLE "integrations" ALTER COLUMN "hubspot_config_default_lifecycle_stage" SET DATA TYPE varchar;
  ALTER TABLE "integrations" ALTER COLUMN "hubspot_config_default_lifecycle_stage" SET DEFAULT 'lead';
  ALTER TABLE "integrations" ALTER COLUMN "hubspot_config_default_lead_status" SET DATA TYPE varchar;
  ALTER TABLE "integrations" ALTER COLUMN "hubspot_config_default_lead_status" SET DEFAULT 'NEW';
  ALTER TABLE "blogs_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "_blogs_v_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blogs_v_rels" ADD CONSTRAINT "_blogs_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "blogs_rels_categories_id_idx" ON "blogs_rels" USING btree ("categories_id");
  CREATE INDEX "_blogs_v_rels_categories_id_idx" ON "_blogs_v_rels" USING btree ("categories_id");
  ALTER TABLE "blogs" DROP COLUMN "categories_id";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_categories_id";
  DROP TYPE "public"."enum_integrations_routing_collections";
  DROP TYPE "public"."enum_integrations_hubspot_config_default_lifecycle_stage";
  DROP TYPE "public"."enum_integrations_hubspot_config_default_lead_status";`)
}
