import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_integrations_routing_events" AS ENUM('document.published', 'lead.submitted');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_integrations_kind" AS ENUM('teamsWorkflow', 'genericWebhook', 'zohoCrm', 'ga4DataApi', 'gscSearchAnalyticsApi', 'gscUrlInspectionApi', 'msClarity', 'cloudflareWebAnalytics', 'calComInbound', 'brevoBounceCallback');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_integrations_source" AS ENUM('db', 'env');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "integrations" (
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "kind" "enum_integrations_kind" NOT NULL,
      "enabled" boolean DEFAULT true,
      "source" "enum_integrations_source" DEFAULT 'db',
      "config" jsonb NOT NULL,
      "last_health_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "integrations_routing_events" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_integrations_routing_events",
      "id" serial PRIMARY KEY NOT NULL
    );
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "integrations_texts" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "text" varchar
    );
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "integrations_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "integrations_routing_events"
        ADD CONSTRAINT "integrations_routing_events_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."integrations"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "integrations_texts"
        ADD CONSTRAINT "integrations_texts_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."integrations"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_integrations_fk"
        FOREIGN KEY ("integrations_id") REFERENCES "public"."integrations"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "integrations_routing_events_order_idx" ON "integrations_routing_events" USING btree ("order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "integrations_routing_events_parent_idx" ON "integrations_routing_events" USING btree ("parent_id");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "integrations_updated_at_idx" ON "integrations" USING btree ("updated_at");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "integrations_created_at_idx" ON "integrations" USING btree ("created_at");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "integrations_texts_order_parent" ON "integrations_texts" USING btree ("order","parent_id");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_integrations_id_idx" ON "payload_locked_documents_rels" USING btree ("integrations_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "integrations_routing_events" DROP CONSTRAINT IF EXISTS "integrations_routing_events_parent_fk";`)
  await db.execute(sql`ALTER TABLE "integrations_texts" DROP CONSTRAINT IF EXISTS "integrations_texts_parent_fk";`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_integrations_fk";`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "integrations_id";`)
  await db.execute(sql`DROP TABLE IF EXISTS "integrations_routing_events" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "integrations_texts" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "integrations" CASCADE;`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_integrations_routing_events";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_integrations_kind";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_integrations_source";`)
}
