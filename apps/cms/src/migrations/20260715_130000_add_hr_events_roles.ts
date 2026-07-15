import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TYPE "public"."enum_users_roles" ADD VALUE IF NOT EXISTS 'hr';`)
  await db.execute(sql`ALTER TYPE "public"."enum_users_roles" ADD VALUE IF NOT EXISTS 'events';`)
}

export async function down(): Promise<void> {
  // Postgres cannot remove a value from an enum type; 'hr'/'events' are left in
  // place (harmless when unused). Reverting the roles is a code-only change.
}
