// src/db/test-setup.ts. Runs in every worker before the test file imports anything.
import { loadDotEnv } from './test-env';

const env = loadDotEnv();
const worker = process.env.VITEST_POOL_ID ?? '1';
const withDb = (url: string, name: string): string => {
  const u = new URL(url);
  u.pathname = `/${name}`;
  return u.toString();
};
const baseName = (url: string): string => new URL(url).pathname.slice(1);

const appUrl = env.PORTAL_TEST_DATABASE_URL;
const ownerUrl = env.PORTAL_TEST_OWNER_URL;
if (!appUrl || !ownerUrl) throw new Error('PORTAL_TEST_DATABASE_URL and PORTAL_TEST_OWNER_URL are required for tests.');

process.env.SKIP_ENV_VALIDATION = '';
process.env.DATABASE_URL = withDb(appUrl, `${baseName(appUrl)}_w${worker}`);
process.env.PORTAL_TEST_DATABASE_URL = process.env.DATABASE_URL;
process.env.PORTAL_TEST_OWNER_URL = withDb(ownerUrl, `${baseName(ownerUrl)}_w${worker}`);
process.env.APP_URL = 'http://localhost:3004';
process.env.AUTH_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.PORTAL_JOBS_ENABLED = 'false';
