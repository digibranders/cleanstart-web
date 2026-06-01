import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "resources_spotlight" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"headline" varchar NOT NULL,
  	"sub" varchar,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE "company_spotlight" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"headline" varchar NOT NULL,
  	"sub" varchar,
  	"cta_label" varchar NOT NULL,
  	"cta_href" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE "resources_spotlight" ADD CONSTRAINT "resources_spotlight_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "company_spotlight" ADD CONSTRAINT "company_spotlight_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "resources_spotlight_image_idx" ON "resources_spotlight" USING btree ("image_id");
  CREATE INDEX "company_spotlight_image_idx" ON "company_spotlight" USING btree ("image_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "resources_spotlight" CASCADE;
  DROP TABLE "company_spotlight" CASCADE;`)
}
