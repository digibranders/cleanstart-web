import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "impact_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE "impact_stats_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );

  ALTER TABLE "impact_stats_stats" ADD CONSTRAINT "impact_stats_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."impact_stats"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "impact_stats_stats_order_idx" ON "impact_stats_stats" USING btree ("_order");
  CREATE INDEX "impact_stats_stats_parent_id_idx" ON "impact_stats_stats" USING btree ("_parent_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "impact_stats_stats" CASCADE;
  DROP TABLE "impact_stats" CASCADE;`);
}
