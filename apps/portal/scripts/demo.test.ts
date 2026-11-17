import { describe, expect, it } from 'vitest';
import { DemoModeError } from '../src/server/demo';
import { assertDemoScriptAllowed } from './demo';

const hosted = 'postgresql://portal_owner:pw@ep-demo-123.eu-central-1.aws.neon.tech/portal?sslmode=require';
const allowed = { PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', DATABASE_URL: hosted, DATABASE_OWNER_URL: hosted };

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
  });

  it('needs the owner URL, because the scripts migrate and truncate as the owner role', () => {
    const { DATABASE_OWNER_URL: _owner, ...rest } = allowed;
    expect(() => assertDemoScriptAllowed('setup', rest)).toThrow(/DATABASE_OWNER_URL/);
  });
});
