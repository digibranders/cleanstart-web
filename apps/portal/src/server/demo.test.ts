import { describe, expect, it } from 'vitest';
import { DemoModeError, assertDemoModeAllowed, isDemoMode } from './demo';

const neon = 'postgresql://portal_app:pw@ep-demo-123.eu-central-1.aws.neon.tech/portal?sslmode=require';

describe('isDemoMode', () => {
  it('is on only for exactly 1', () => {
    expect(isDemoMode({ PORTAL_DEMO_MODE: '1' })).toBe(true);
    for (const value of [undefined, '', '0', 'true', 'yes', ' 1', '1 ', 'TRUE']) {
      expect(isDemoMode({ PORTAL_DEMO_MODE: value }), String(value)).toBe(false);
    }
  });
});

describe('assertDemoModeAllowed', () => {
  it('does nothing when the switch is off, whatever the environment', () => {
    expect(() => assertDemoModeAllowed({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@localhost/d' })).not.toThrow();
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: 'true', NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@localhost/d' })).not.toThrow();
  });

  it('allows a hosted database in production', () => {
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', DATABASE_URL: neon, DATABASE_OWNER_URL: neon })).not.toThrow();
  });

  it('allows a local database outside production', () => {
    for (const NODE_ENV of ['development', 'test', undefined]) {
      expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV, DATABASE_URL: 'postgresql://u:p@localhost:5432/d' })).not.toThrow();
    }
  });

  it.each([
    'postgresql://u:p@localhost:5432/d',
    'postgresql://u:p@LOCALHOST.:5432/d',
    'postgresql://u:p@127.0.0.1:5432/d',
    'postgresql://u:p@127.8.9.10:5432/d',
    'postgresql://u:p@[::1]:5432/d',
    'postgresql://u:p@0.0.0.0:5432/d',
    'postgresql://u:p@db.localhost:5432/d',
    'postgresql://u:p@postgres:5432/cleanstart_portal',
  ])('refuses %s in production', (url) => {
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', DATABASE_URL: url })).toThrow(DemoModeError);
  });

  it('refuses a host under cleanstart.com in any environment', () => {
    for (const NODE_ENV of ['production', 'development']) {
      expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV, DATABASE_URL: 'postgresql://u:p@db.cleanstart.com/d' })).toThrow(/cleanstart\.com/);
      expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV, DATABASE_URL: 'postgresql://u:p@cleanstart.com/d' })).toThrow(DemoModeError);
    }
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@notcleanstart.com/d' })).not.toThrow();
  });

  it('refuses a host on PORTAL_DEMO_DENY_HOSTS, exact or as a parent domain', () => {
    const env = { PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', PORTAL_DEMO_DENY_HOSTS: ' 203.0.113.7 , prod.example.net ' };
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_URL: 'postgresql://u:p@203.0.113.7:5432/d' })).toThrow(/deny list/);
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_URL: 'postgresql://u:p@db.prod.example.net/d' })).toThrow(/deny list/);
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_URL: neon })).not.toThrow();
  });

  it('checks the owner URL as well as the app URL', () => {
    const env = { PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', DATABASE_URL: neon };
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_OWNER_URL: 'postgresql://u:p@127.0.0.1/d' })).toThrow(/DATABASE_OWNER_URL/);
  });

  it('refuses the production portal address as APP_URL', () => {
    const env = { PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', DATABASE_URL: neon };
    expect(() => assertDemoModeAllowed({ ...env, APP_URL: 'https://partners.cleanstart.com' })).toThrow(/APP_URL/);
    expect(() => assertDemoModeAllowed({ ...env, APP_URL: 'https://portal-demo.vercel.app' })).not.toThrow();
  });

  it('refuses a missing or unparseable database URL', () => {
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1' })).toThrow(/DATABASE_URL is not set/);
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', DATABASE_URL: 'not a url' })).toThrow(/not a valid URL/);
  });

  it('never prints a password', () => {
    try {
      assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:hunter2secret@localhost/d' });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain('hunter2secret');
    }
  });
});
