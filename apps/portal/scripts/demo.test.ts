import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';
import { DemoModeError } from '../src/server/demo';
import { assertDemoDatabase, assertDemoScriptAllowed } from './demo';

const hosted = 'postgresql://portal_owner:pw@ep-demo-123.eu-central-1.aws.neon.tech/portal?sslmode=require';
const allowed = {
  PORTAL_DEMO_MODE: '1',
  NODE_ENV: 'production',
  DATABASE_URL: hosted,
  DATABASE_OWNER_URL: hosted,
  PORTAL_DEMO_DATABASE_HOSTS: 'neon.tech',
  PORTAL_REVIEW_PASSWORD: 'review-password-16',
};

describe('assertDemoScriptAllowed', () => {
  it.each(['setup', 'reset'] as const)('lets demo:%s run against a hosted demo database', (command) => {
    expect(() => assertDemoScriptAllowed(command, allowed)).not.toThrow();
  });

  it.each(['setup', 'reset'] as const)('refuses demo:%s unless PORTAL_DEMO_MODE is exactly 1', (command) => {
    for (const PORTAL_DEMO_MODE of [undefined, '', '0', 'true']) {
      expect(() => assertDemoScriptAllowed(command, { ...allowed, PORTAL_DEMO_MODE }), String(PORTAL_DEMO_MODE)).toThrow(/PORTAL_DEMO_MODE=1/);
    }
  });

  it.each(['setup', 'reset'] as const)('refuses demo:%s on the production database, so a reset can never truncate it', (command) => {
    expect(() => assertDemoScriptAllowed(command, { ...allowed, DATABASE_URL: 'postgresql://u:p@postgres:5432/cleanstart_portal' })).toThrow(DemoModeError);
    expect(() => assertDemoScriptAllowed(command, { ...allowed, DATABASE_OWNER_URL: 'postgresql://u:p@db.cleanstart.com/d' })).toThrow(/cleanstart\.com/);
    expect(() => assertDemoScriptAllowed(command, { ...allowed, PORTAL_DEMO_DENY_HOSTS: 'neon.tech' })).toThrow(/deny list/);
    expect(() => assertDemoScriptAllowed(command, { ...allowed, PORTAL_DEMO_DATABASE_HOSTS: undefined })).toThrow(/PORTAL_DEMO_DATABASE_HOSTS/);
  });

  it('needs the owner URL, because the scripts migrate and truncate as the owner role', () => {
    const { DATABASE_OWNER_URL: _owner, ...rest } = allowed;
    expect(() => assertDemoScriptAllowed('setup', rest)).toThrow(/DATABASE_OWNER_URL/);
  });
});

/** A fake owner connection: answers the two catalog queries the check makes. */
const ownerOf = (state: { database: string; tables: number; sentinel: boolean }): Pick<Pool, 'query'> =>
  ({
    query: async (sql: string) => ({ rows: sql.includes('current_database') ? [{ name: state.database }] : [{ tables: state.tables, sentinel: state.sentinel }] }),
  }) as unknown as Pick<Pool, 'query'>;

describe('assertDemoDatabase', () => {
  it('lets reset run on a database with demo in its name that setup created', async () => {
    await expect(assertDemoDatabase('reset', ownerOf({ database: 'portal_demo', tables: 22, sentinel: true }))).resolves.toBeUndefined();
    await expect(assertDemoDatabase('reset', ownerOf({ database: 'Cleanstart_Portal_DEMO_2', tables: 22, sentinel: true }))).resolves.toBeUndefined();
  });

  it('refuses reset on a database whose name does not contain demo, before anything is truncated', async () => {
    await expect(assertDemoDatabase('reset', ownerOf({ database: 'cleanstart_portal', tables: 22, sentinel: true }))).rejects.toThrow(/"cleanstart_portal" does not have "demo" in its name/);
  });

  it('refuses either command on a database that has tables but no demo_files sentinel', async () => {
    for (const command of ['setup', 'reset'] as const) {
      await expect(assertDemoDatabase(command, ownerOf({ database: 'portal_demo', tables: 22, sentinel: false })), command).rejects.toThrow(/demo_files/);
    }
  });

  it('lets setup run on an empty database, and on one it already set up', async () => {
    await expect(assertDemoDatabase('setup', ownerOf({ database: 'portal', tables: 0, sentinel: false }))).resolves.toBeUndefined();
    await expect(assertDemoDatabase('setup', ownerOf({ database: 'portal', tables: 22, sentinel: true }))).resolves.toBeUndefined();
  });
});
