import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" ADD COLUMN "hubspot_form_guid" varchar;
  ALTER TABLE "_forms_v" ADD COLUMN "version_hubspot_form_guid" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP COLUMN "hubspot_form_guid";
  ALTER TABLE "_forms_v" DROP COLUMN "version_hubspot_form_guid";`)
}
