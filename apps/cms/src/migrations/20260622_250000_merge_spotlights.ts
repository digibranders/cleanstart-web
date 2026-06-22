import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Merge the identical resourcesSpotlight + companySpotlight globals into one
// `spotlights` global (resources + company groups). Creates the new table,
// copies the single-row data across, then drops the old tables.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "spotlights" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"resources_image_id" integer,
  	"resources_headline" varchar,
  	"resources_sub" varchar,
  	"resources_cta_label" varchar,
  	"resources_cta_href" varchar,
  	"resources_expires_at" timestamp(3) with time zone,
  	"company_image_id" integer,
  	"company_headline" varchar,
  	"company_sub" varchar,
  	"company_cta_label" varchar,
  	"company_cta_href" varchar,
  	"company_expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_resources_image_id_media_id_fk" FOREIGN KEY ("resources_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "spotlights" ADD CONSTRAINT "spotlights_company_image_id_media_id_fk" FOREIGN KEY ("company_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "spotlights_resources_resources_image_idx" ON "spotlights" USING btree ("resources_image_id");
  CREATE INDEX "spotlights_company_company_image_idx" ON "spotlights" USING btree ("company_image_id");
  INSERT INTO "spotlights" (
    "resources_image_id","resources_headline","resources_sub","resources_cta_label","resources_cta_href","resources_expires_at",
    "company_image_id","company_headline","company_sub","company_cta_label","company_cta_href","company_expires_at",
    "updated_at","created_at")
  SELECT r."image_id", r."headline", r."sub", r."cta_label", r."cta_href", r."expires_at",
         c."image_id", c."headline", c."sub", c."cta_label", c."cta_href", c."expires_at",
         now(), now()
  FROM (SELECT * FROM "resources_spotlight" ORDER BY "id" LIMIT 1) r
  FULL OUTER JOIN (SELECT * FROM "company_spotlight" ORDER BY "id" LIMIT 1) c ON true;
  DROP TABLE "resources_spotlight" CASCADE;
  DROP TABLE "company_spotlight" CASCADE;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "resources_spotlight" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"headline" varchar,
  	"sub" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  CREATE TABLE "company_spotlight" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"headline" varchar,
  	"sub" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  ALTER TABLE "resources_spotlight" ADD CONSTRAINT "resources_spotlight_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "company_spotlight" ADD CONSTRAINT "company_spotlight_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "resources_spotlight_image_idx" ON "resources_spotlight" USING btree ("image_id");
  CREATE INDEX "company_spotlight_image_idx" ON "company_spotlight" USING btree ("image_id");
  INSERT INTO "resources_spotlight" ("image_id","headline","sub","cta_label","cta_href","expires_at","updated_at","created_at")
  SELECT "resources_image_id","resources_headline","resources_sub","resources_cta_label","resources_cta_href","resources_expires_at", now(), now()
  FROM "spotlights" ORDER BY "id" LIMIT 1;
  INSERT INTO "company_spotlight" ("image_id","headline","sub","cta_label","cta_href","expires_at","updated_at","created_at")
  SELECT "company_image_id","company_headline","company_sub","company_cta_label","company_cta_href","company_expires_at", now(), now()
  FROM "spotlights" ORDER BY "id" LIMIT 1;
  DROP TABLE "spotlights" CASCADE;`)
}
