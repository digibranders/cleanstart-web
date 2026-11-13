import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

/** apps/portal/.env merged under process.env, so CI can inject variables and a local .env fills the rest. */
export const loadDotEnv = (): Record<string, string | undefined> => {
  const file = join(process.cwd(), '.env');
  const fromFile = existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
  return { ...fromFile, ...process.env };
};
