import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { poolConnection } from './connection';

describe('poolConnection', () => {
  beforeEach(() => vi.stubEnv('PORTAL_DEMO_MODE', '1'));
  afterEach(() => vi.unstubAllEnvs());

  it('leaves a URL without sslmode exactly as it was, so nothing changes for the real portal', () => {
    for (const url of ['postgresql://portal_app:pw@localhost:5432/cleanstart_portal', 'postgresql://u:p%40ss@db.internal/d?application_name=portal']) {
      expect(poolConnection(url)).toEqual({ connectionString: url });
    }
  });

  it('maps sslmode=require to an encrypted connection that accepts a self signed certificate, as libpq does', () => {
    expect(poolConnection('postgresql://portal_app:pw@demo-db.example.net:5432/portal_demo?sslmode=require')).toEqual({
      connectionString: 'postgresql://portal_app:pw@demo-db.example.net:5432/portal_demo',
      ssl: { rejectUnauthorized: false },
    });
  });

  it('keeps the other query parameters and an encoded password intact', () => {
    const { connectionString, ssl } = poolConnection('postgresql://portal_owner:p%40ss%2Fw%3Ard@demo-db.example.net/portal_demo?application_name=demo&sslmode=require');
    const parsed = new URL(connectionString ?? '');
    expect(decodeURIComponent(parsed.password)).toBe('p@ss/w:rd');
    expect(parsed.searchParams.get('application_name')).toBe('demo');
    expect(parsed.searchParams.has('sslmode')).toBe(false);
    expect(ssl).toEqual({ rejectUnauthorized: false });
  });

  it.each(['verify-full', 'verify-ca', 'disable', 'prefer'])('passes sslmode=%s through for the driver to interpret', (mode) => {
    const url = `postgresql://u:p@db.example.net/d?sslmode=${mode}`;
    expect(poolConnection(url)).toEqual({ connectionString: url });
  });

  it('respects an explicit uselibpqcompat, which the driver already understands', () => {
    const url = 'postgresql://u:p@db.example.net/d?sslmode=require&uselibpqcompat=true';
    expect(poolConnection(url)).toEqual({ connectionString: url });
  });

  it('passes something that is not a URL through unchanged and lets the driver report it', () => {
    expect(poolConnection('not a url')).toEqual({ connectionString: 'not a url' });
  });

  it('never touches sslmode=require unless demo mode is exactly 1, so the real portal keeps the driver behaviour', () => {
    const url = 'postgresql://portal_app:pw@db.example.net:5432/portal?sslmode=require';
    for (const value of [undefined, '', '0', 'true']) {
      vi.stubEnv('PORTAL_DEMO_MODE', value as string);
      expect(poolConnection(url), String(value)).toEqual({ connectionString: url });
    }
  });

  it('never downgrades verify-full, with demo mode on or off', () => {
    const url = 'postgresql://u:p@db.example.net/d?sslmode=verify-full';
    expect(poolConnection(url)).toEqual({ connectionString: url });
    vi.stubEnv('PORTAL_DEMO_MODE', '');
    expect(poolConnection(url)).toEqual({ connectionString: url });
  });
});
