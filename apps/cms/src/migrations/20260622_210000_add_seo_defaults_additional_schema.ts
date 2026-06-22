import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Site-wide custom JSON-LD override on the seoDefaults global (+ its version
// table). Composed into every page's @graph at build time.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "seo_defaults" ADD COLUMN "additional_schema" jsonb;
    ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_additional_schema" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "seo_defaults" DROP COLUMN "additional_schema";
    ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_additional_schema";`)
}
