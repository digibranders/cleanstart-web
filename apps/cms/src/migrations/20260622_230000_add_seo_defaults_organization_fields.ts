import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Organization JSON-LD fields on the seoDefaults global: founding, founders[],
// address (PostalAddress), contactPoint[], email/telephone, numberOfEmployees,
// alternateName, slogan, and B2B identifiers — columns on seo_defaults (+ its
// version table) plus the founders/contactPoints array tables.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_alternate_name" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_slogan" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_founding_date" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_founding_location" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_number_of_employees" numeric;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_email" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_telephone" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_address_street_address" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_address_address_locality" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_address_address_region" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_address_postal_code" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_address_address_country" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_identifiers_vat_i_d" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_identifiers_tax_i_d" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_identifiers_duns" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_identifiers_naics" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_organization_json_ld_identifiers_iso6523" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_alternate_name" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_slogan" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_founding_date" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_founding_location" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_number_of_employees" numeric;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_email" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_telephone" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_address_street_address" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_address_address_locality" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_address_address_region" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_address_postal_code" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_address_address_country" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_identifiers_vat_i_d" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_identifiers_tax_i_d" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_identifiers_duns" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_identifiers_naics" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "organization_json_ld_identifiers_iso6523" varchar;
  CREATE TABLE "seo_defaults_organization_json_ld_founders" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"job_title" varchar,
  	"url" varchar
  );
  CREATE TABLE "seo_defaults_organization_json_ld_contact_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"contact_type" varchar NOT NULL,
  	"telephone" varchar,
  	"email" varchar,
  	"area_served" varchar
  );
  CREATE TABLE "_seo_defaults_v_version_organization_json_ld_founders" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"job_title" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  CREATE TABLE "_seo_defaults_v_version_organization_json_ld_contact_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_type" varchar NOT NULL,
  	"telephone" varchar,
  	"email" varchar,
  	"area_served" varchar,
  	"_uuid" varchar
  );
  ALTER TABLE "seo_defaults_organization_json_ld_founders" ADD CONSTRAINT "seo_defaults_organization_json_ld_founders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo_defaults"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_defaults_organization_json_ld_contact_points" ADD CONSTRAINT "seo_defaults_organization_json_ld_contact_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo_defaults"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v_version_organization_json_ld_founders" ADD CONSTRAINT "_seo_defaults_v_version_organization_json_ld_founders_parent_id" FOREIGN KEY ("_parent_id") REFERENCES "public"."_seo_defaults_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v_version_organization_json_ld_contact_points" ADD CONSTRAINT "_seo_defaults_v_version_organization_json_ld_contact_point_par" FOREIGN KEY ("_parent_id") REFERENCES "public"."_seo_defaults_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "seo_defaults_organization_json_ld_founders_order_idx" ON "seo_defaults_organization_json_ld_founders" USING btree ("_order");
  CREATE INDEX "seo_defaults_organization_json_ld_founders_parent_id_idx" ON "seo_defaults_organization_json_ld_founders" USING btree ("_parent_id");
  CREATE INDEX "seo_defaults_organization_json_ld_contact_points_order_idx" ON "seo_defaults_organization_json_ld_contact_points" USING btree ("_order");
  CREATE INDEX "seo_defaults_organization_json_ld_contact_points_parent_id_idx" ON "seo_defaults_organization_json_ld_contact_points" USING btree ("_parent_id");
  CREATE INDEX "_seo_defaults_v_version_organization_json_ld_founders_order_idx" ON "_seo_defaults_v_version_organization_json_ld_founders" USING btree ("_order");
  CREATE INDEX "_seo_defaults_v_version_organization_json_ld_founders_parent_id" ON "_seo_defaults_v_version_organization_json_ld_founders" USING btree ("_parent_id");
  CREATE INDEX "_seo_defaults_v_version_organization_json_ld_contact_points_ord" ON "_seo_defaults_v_version_organization_json_ld_contact_points" USING btree ("_order");
  CREATE INDEX "_seo_defaults_v_version_organization_json_ld_contact_points_par" ON "_seo_defaults_v_version_organization_json_ld_contact_points" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "seo_defaults_organization_json_ld_founders" CASCADE;
  DROP TABLE "seo_defaults_organization_json_ld_contact_points" CASCADE;
  DROP TABLE "_seo_defaults_v_version_organization_json_ld_founders" CASCADE;
  DROP TABLE "_seo_defaults_v_version_organization_json_ld_contact_points" CASCADE;
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_alternate_name";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_slogan";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_founding_date";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_founding_location";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_number_of_employees";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_email";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_telephone";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_address_street_address";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_address_address_locality";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_address_address_region";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_address_postal_code";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_address_address_country";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_identifiers_vat_i_d";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_identifiers_tax_i_d";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_identifiers_duns";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_identifiers_naics";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_organization_json_ld_identifiers_iso6523";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_alternate_name";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_slogan";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_founding_date";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_founding_location";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_number_of_employees";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_email";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_telephone";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_address_street_address";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_address_address_locality";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_address_address_region";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_address_postal_code";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_address_address_country";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_identifiers_vat_i_d";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_identifiers_tax_i_d";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_identifiers_duns";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_identifiers_naics";
  ALTER TABLE "seo_defaults" DROP COLUMN "organization_json_ld_identifiers_iso6523";`)
}
