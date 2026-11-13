import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));

/** Every package the build plans import. A later task that needs another one is `blocked` (BUILD-HANDOFF, amendment 1). */
const PACKAGES = [
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@cleanstart/forms',
  '@hubspot/api-client',
  '@playwright/test',
  '@sentry/nextjs',
  '@types/pg',
  'better-auth',
  'drizzle-kit',
  'drizzle-orm',
  'node-cron',
  'pg',
  'tsx',
  'vitest',
  'zod',
] as const;

describe('portal structure', () => {
  it.each(PACKAGES)('has %s installed', (name) => {
    expect(existsSync(join(root, 'node_modules', name, 'package.json')), `${name} is not installed`).toBe(true);
  });

  it.each(['src/server', 'src/db', 'scripts'])('has the %s folder with a README', (folder) => {
    expect(existsSync(join(root, folder, 'README.md')), `${folder}/README.md is missing`).toBe(true);
  });

  it('keeps the package scripts the plans call', () => {
    const scripts = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    for (const name of ['lint', 'typecheck', 'test', 'build', 'db:generate', 'db:migrate', 'db:seed']) {
      expect(scripts[name], `script ${name}`).toBeTypeOf('string');
    }
  });
});
