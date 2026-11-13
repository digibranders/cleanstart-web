// Must be first: sets the database and the fakes before any src/ module reads the environment.
import './support/env';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type FullConfig } from '@playwright/test';
import { migrateDatabase } from '../scripts/migrate';
import { seedBase } from './support/db';
import { E2E, PERSONAS, type PersonaKey } from './support/env';
import { signIn } from './support/ui';

/**
 * Runs after the dev server is up and before the first test: migrate the e2e database exactly as production does
 * (drizzle migrations, then rls.sql), seed it, and sign each persona in once so specs start from a stored session.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const root = process.cwd();
  await migrateDatabase({
    url: process.env.PORTAL_TEST_OWNER_URL ?? '',
    migrationsFolder: join(root, 'drizzle'),
    rlsSql: readFileSync(join(root, 'src/db/rls.sql'), 'utf8'),
  });
  await seedBase();

  mkdirSync(join(root, 'e2e/.auth'), { recursive: true });
  const browser = await chromium.launch(config.projects[0]?.use.channel ? { channel: config.projects[0].use.channel } : {});
  try {
    for (const key of Object.keys(PERSONAS) as PersonaKey[]) {
      const context = await browser.newContext({ baseURL: E2E.baseUrl });
      const page = await context.newPage();
      await signIn(page, PERSONAS[key].email);
      await context.storageState({ path: join(root, PERSONAS[key].file) });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
