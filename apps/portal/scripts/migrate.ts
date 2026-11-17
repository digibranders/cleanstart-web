import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { poolConnection } from '../src/db/connection';

export interface MigrateInput {
  /** Connection string of the owner role (portal_owner), never the runtime role. */
  url: string;
  migrationsFolder: string;
  /** The contents of src/db/rls.sql. Re-applied on every run, so it must stay idempotent. */
  rlsSql: string;
}

/** Drizzle migrations, then rls.sql in one transaction. Safe to run any number of times. */
export async function migrateDatabase(input: MigrateInput): Promise<void> {
  const pool = new Pool({ ...poolConnection(input.url), max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: input.migrationsFolder });
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(input.rlsSql);
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const url = process.env.DATABASE_OWNER_URL;
  if (!url) {
    console.error('DATABASE_OWNER_URL is not set. Run with: tsx --env-file=.env scripts/migrate.ts');
    process.exit(1);
  }
  migrateDatabase({
    url,
    migrationsFolder: join(process.cwd(), 'drizzle'),
    rlsSql: readFileSync(join(process.cwd(), 'src/db/rls.sql'), 'utf8'),
  })
    .then(() => console.info('migrations and row level security applied'))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
