import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // The `media.folder` Postgres enum predates the `web/case-study` bucket.
  // Adding it to the FOLDERS list in Media.ts fixed the Payload select
  // validation, but uploads for case-study logo/cover/asset fields still
  // failed at the DB layer with `invalid input value for enum
  // enum_media_folder: "web/case-study"`. Add the value to the enum type.
  await db.execute(sql`ALTER TYPE "public"."enum_media_folder" ADD VALUE IF NOT EXISTS 'web/case-study';`)
}

export async function down(): Promise<void> {
  // Postgres cannot remove a value from an enum type; 'web/case-study' is
  // left in place (harmless when unused). Reverting is a code-only change.
}
