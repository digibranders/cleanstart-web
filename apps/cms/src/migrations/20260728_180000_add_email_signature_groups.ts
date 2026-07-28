import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Three directory groups added after the first import: Product & Program
// Management, Infrastructure & Systems, and Legal. The employee set grew from
// 20 to 40 and those roles (Product Manager / Project Coordinator, four Linux
// System Administrators, and a Legal Executive) do not belong under any of the
// original six.
//
// Both the live enum and its versions twin have to change, or writing a
// signature in a new group succeeds on the main table and then fails when the
// version row is inserted.
//
// `ALTER TYPE ... ADD VALUE` is legal inside a transaction on PG12+ (the
// server is PG16) — the restriction that remains is that the new label cannot
// be *used* in the same transaction, which is fine: seeding runs separately.
// `IF NOT EXISTS` makes this re-runnable.

// Three are needed now; the rest are reserved headroom so a future org change
// is a dropdown selection rather than a migration + deploy. Unused labels cost
// nothing in Postgres and never render (the directory drops empty groups).
const GROUPS = [
  'Product & Program Management',
  'Infrastructure & Systems',
  'Legal',
  'Finance & Accounts',
  'Customer Success',
  'Partnerships & Alliances',
  'Operations',
  'Data & Analytics',
  'Design',
  'IT & Security',
  'Quality Assurance',
  'Training & Enablement',
  'Administration',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const type of [
    'enum_email_signatures_group',
    'enum__email_signatures_v_version_group',
  ] as const) {
    for (const group of GROUPS) {
      await db.execute(
        sql.raw(
          `ALTER TYPE "public"."${type}" ADD VALUE IF NOT EXISTS '${group.replace(/'/g, "''")}';`,
        ),
      )
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Postgres cannot drop a value from an enum. Reversing this would mean
  // recreating both types and rewriting every dependent column — destructive
  // and far riskier than leaving three unused labels in place. Rolling back
  // the collection entirely is handled by the previous migration's `down`.
}
