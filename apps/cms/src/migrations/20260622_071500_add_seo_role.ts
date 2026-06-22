import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TYPE "public"."enum_users_roles" ADD VALUE IF NOT EXISTS 'seo';`)
}

export async function down(): Promise<void> {
  // Postgres cannot remove a value from an enum type; 'seo' is left in place
  // (harmless when unused). Reverting the role is a code-only change.
}
