// src/db/test-global-setup.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { assertTestDatabaseUrl, loadDotEnv } from './test-env';

const WORKERS = 4;
const withDb = (url: string, name: string): string => {
  const u = new URL(url);
  u.pathname = `/${name}`;
  return u.toString();
};

export default async function setup(): Promise<void> {
  const env = loadDotEnv();
  const baseUrl = env.PORTAL_TEST_OWNER_URL;
  if (!baseUrl) throw new Error('PORTAL_TEST_OWNER_URL is not set. Create the test database with scripts/db-create.sh and put it in apps/portal/.env.');
  const baseName = assertTestDatabaseUrl('PORTAL_TEST_OWNER_URL', baseUrl);
  if (env.PORTAL_TEST_DATABASE_URL) assertTestDatabaseUrl('PORTAL_TEST_DATABASE_URL', env.PORTAL_TEST_DATABASE_URL);

  // 1. Migrate the base database exactly as production does: drizzle migrations, then rls.sql.
  const { migrateDatabase } = await import('../../scripts/migrate');
  await migrateDatabase({ url: baseUrl, migrationsFolder: join(process.cwd(), 'drizzle'), rlsSql: readFileSync(join(process.cwd(), 'src/db/rls.sql'), 'utf8') });

  // 2. Clone it once per worker. The base must have no open connections while it is a template.
  const admin = new Client({ connectionString: withDb(baseUrl, 'postgres') });
  await admin.connect();
  try {
    for (let n = 1; n <= WORKERS; n += 1) {
      const name = `${baseName}_w${n}`;
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await admin.query(`CREATE DATABASE "${name}" TEMPLATE "${baseName}"`);
    }
  } finally {
    await admin.end();
  }
}
