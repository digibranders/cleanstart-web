import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

/** apps/portal/.env merged under process.env, so CI can inject variables and a local .env fills the rest. */
export const loadDotEnv = (): Record<string, string | undefined> => {
  const file = join(process.cwd(), '.env');
  const fromFile = existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
  return { ...fromFile, ...process.env };
};

/** The database name in a Postgres URL. Global setup drops and recreates clones of it, so it must be a test database. */
export const assertTestDatabaseUrl = (variable: string, url: string): string => {
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith('_test')) {
    throw new Error(`${variable} points at database "${name}". The test setup drops and recreates clones of it, so the name must end in _test.`);
  }
  return name;
};
