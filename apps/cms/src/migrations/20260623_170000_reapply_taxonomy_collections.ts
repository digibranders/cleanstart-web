import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { up as upTaxonomy } from './20260623_160000_add_taxonomy_collections'

// Re-apply the taxonomy schema.
//
// 20260623_160000_add_taxonomy_collections is recorded as applied in prod's
// payload_migrations table, yet the ...Ref columns + taxonomy objects it was
// meant to create are absent from the DB (admin/list views 500 with
// "column _jobs_v.version_department_ref_id does not exist"). Because Payload
// runs each migration name exactly once, redeploying never re-runs 160000 — a
// new migration name is required to make the runner execute the DDL again.
//
// 160000's up() is now fully idempotent (CREATE ... IF NOT EXISTS + DO-guarded
// CREATE TYPE / ADD CONSTRAINT), so re-running it adds only the missing objects
// and is a no-op where they already exist. Reused directly rather than copied
// to keep the two in lockstep.
export async function up(args: MigrateUpArgs): Promise<void> {
  await upTaxonomy(args)
}

// No-op: tearing the taxonomy schema down on rollback is owned by 160000's
// down(). This migration only ensures the objects exist; reversing it must not
// drop them.
export async function down(_args: MigrateDownArgs): Promise<void> {}
