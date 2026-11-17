import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Pool } from 'pg';
import { DemoModeError, assertDemoModeAllowed, isDemoMode } from '../src/server/demo';
import { DEMO_FILES_DDL } from '../src/server/files/demo-store';
import { migrateDatabase } from './migrate';

type Command = 'setup' | 'reset';
type Source = Record<string, string | undefined>;

/** Both commands refuse unless the switch is on and the target is not the real portal: reset truncates every table. */
export function assertDemoScriptAllowed(command: Command, source: Source): void {
  if (!isDemoMode(source)) throw new DemoModeError(`demo:${command} refused: PORTAL_DEMO_MODE=1 is not set.`);
  assertDemoModeAllowed(source);
  if (!source.DATABASE_OWNER_URL) throw new DemoModeError(`demo:${command} refused: DATABASE_OWNER_URL is not set (the scripts migrate and truncate as the owner role).`);
}

/** Migrate, create the demo upload table, then seed the mock data once. Safe to run any number of times. */
async function setup(ownerUrl: string): Promise<void> {
  await migrateDatabase({
    url: ownerUrl,
    migrationsFolder: join(process.cwd(), 'drizzle'),
    rlsSql: readFileSync(join(process.cwd(), 'src/db/rls.sql'), 'utf8'),
  });
  const owner = new Pool({ connectionString: ownerUrl, max: 1 });
  try {
    await owner.query(DEMO_FILES_DDL);
  } finally {
    await owner.end();
  }

  const [{ db, pool }, { DEV_SEED_PASSWORD, seedMockData }, { systemClock }, { hashPassword }, { sql }] = await Promise.all([
    import('../src/db/client'),
    import('../src/db/fixtures'),
    import('../src/lib/clock'),
    import('../src/server/auth/passwords'),
    import('drizzle-orm'),
  ]);
  try {
    const existing = Number((await db.execute(sql`select count(*)::int as n from partners`)).rows[0]?.n ?? 0);
    if (existing > 0) {
      console.info('demo data already present, nothing seeded');
      return;
    }
    console.info('seeded the demo data', await seedMockData(db, { clock: systemClock, passwordHash: await hashPassword(DEV_SEED_PASSWORD) }));
  } finally {
    await pool.end();
  }
}

/** Empties every table of the public schema (drizzle's migration history lives in its own schema and stays) and restarts the sequences. */
async function truncateAll(ownerUrl: string): Promise<void> {
  const owner = new Pool({ connectionString: ownerUrl, max: 1 });
  try {
    const { rows } = await owner.query<{ tablename: string }>("select tablename from pg_tables where schemaname = 'public'");
    if (rows.length > 0) {
      await owner.query(`truncate table ${rows.map((row) => `"${row.tablename}"`).join(', ')} restart identity cascade`);
    }
    await owner.query('alter sequence if exists application_reference_seq restart');
    console.info(`truncated ${rows.length} tables`);
  } finally {
    await owner.end();
  }
}

export async function runDemoCommand(command: Command, source: Source = process.env): Promise<void> {
  assertDemoScriptAllowed(command, source);
  const ownerUrl = source.DATABASE_OWNER_URL ?? '';
  if (command === 'reset') await truncateAll(ownerUrl);
  await setup(ownerUrl);
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const command = process.argv[2];
  if (command !== 'setup' && command !== 'reset') {
    console.error('Usage: tsx scripts/demo.ts setup|reset');
    process.exit(1);
  }
  runDemoCommand(command).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
