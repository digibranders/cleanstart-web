import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from './env';

// Importing ./env parses process.env once at load. These tests call loadEnv with their own objects, so skip that parse.
vi.hoisted(() => {
  process.env.SKIP_ENV_VALIDATION = '1';
});

const base = {
  DATABASE_URL: 'postgresql://portal_app:pw@localhost:5432/cleanstart_portal',
  AUTH_SECRET: 'a'.repeat(32),
};

const production = {
  ...base,
  NODE_ENV: 'production',
  APP_URL: 'https://partners.cleanstart.com',
  DATABASE_OWNER_URL: 'postgresql://portal_owner:pw@localhost:5432/cleanstart_portal',
  BREVO_API_KEY: 'k',
  BREVO_SENDER_EMAIL: 'partners@cleanstart.com',
  R2_ENDPOINT: 'https://r2.example.com',
  R2_BUCKET: 'b',
  R2_ACCESS_KEY_ID: 'id',
  R2_SECRET_ACCESS_KEY: 'secret',
  HUBSPOT_PORTAL_TOKEN: 't',
  HUBSPOT_PARTNER_PIPELINE_ID: 'p',
  HUBSPOT_WEBHOOK_SECRET: 'w',
  TURNSTILE_SECRET_KEY: 's',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'k',
  SENTRY_DSN: 'https://abc@sentry.example.com/1',
};

describe('loadEnv', () => {
  it('throws naming DATABASE_URL when it is missing', () => {
    expect(() => loadEnv({ AUTH_SECRET: base.AUTH_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('throws when AUTH_SECRET is shorter than 32 characters', () => {
    expect(() => loadEnv({ ...base, AUTH_SECRET: 'short' })).toThrow(/AUTH_SECRET/);
  });

  it('lists every missing variable in one message', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL[\s\S]*AUTH_SECRET/);
  });

  it('applies the defaults', () => {
    const env = loadEnv(base);
    expect(env.APP_URL).toBe('http://localhost:3004');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.HUBSPOT_USE_ASSOCIATION_LABELS).toBe(false);
    expect(env.PORTAL_JOBS_ENABLED).toBe(false);
    expect(env.PARTNER_AGREEMENT_VERSION).toBe('draft-0');
    expect(env.CMS_API_URL).toBe('http://cms:3000');
  });

  it('parses boolean switches', () => {
    expect(loadEnv({ ...base, PORTAL_JOBS_ENABLED: 'true' }).PORTAL_JOBS_ENABLED).toBe(true);
    expect(loadEnv({ ...base, HUBSPOT_USE_ASSOCIATION_LABELS: '1' }).HUBSPOT_USE_ASSOCIATION_LABELS).toBe(true);
  });

  it('uses the Turnstile test keys outside production only', () => {
    expect(loadEnv(base).NEXT_PUBLIC_TURNSTILE_SITE_KEY).toBe('1x00000000000000000000AA');
    expect(loadEnv(base).TURNSTILE_SECRET_KEY).toBe('1x0000000000000000000000000000000AA');
    expect(loadEnv(production).TURNSTILE_SECRET_KEY).toBe('s');
  });

  it('accepts a complete production environment', () => {
    expect(loadEnv(production).NODE_ENV).toBe('production');
  });

  it('names the missing production variable', () => {
    const { HUBSPOT_PORTAL_TOKEN: _omitted, ...rest } = production;
    expect(() => loadEnv(rest)).toThrow(/HUBSPOT_PORTAL_TOKEN is required in production/);
  });

  it('names DATABASE_URL, AUTH_SECRET and DATABASE_OWNER_URL together for a clean production start', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow(
      /DATABASE_URL is required[\s\S]*AUTH_SECRET is required[\s\S]*DATABASE_OWNER_URL is required in production/,
    );
  });

  it('names DATABASE_OWNER_URL even when only DATABASE_URL is missing in production', () => {
    const { DATABASE_URL: _omitted, DATABASE_OWNER_URL: _owner, ...rest } = production;
    expect(() => loadEnv(rest)).toThrow(/DATABASE_URL is required[\s\S]*DATABASE_OWNER_URL is required in production/);
  });

  it('refuses an http APP_URL in production, naming the variable and the scheme', () => {
    expect(() => loadEnv({ ...production, APP_URL: 'http://partners.cleanstart.com' })).toThrow(
      /APP_URL must start with https:\/\/ in production/,
    );
  });

  it.each(['http://localhost.evil.com', 'http://localhost@evil.com', 'http://127.0.0.1.evil.com', 'http://0.0.0.0'])(
    'refuses the look-alike loopback host %s in production',
    (APP_URL) => {
      expect(() => loadEnv({ ...production, APP_URL })).toThrow(/APP_URL must start with https:\/\//);
    },
  );

  it('treats an unset APP_URL in production as missing, reported with the other required variables', () => {
    const { APP_URL: _omitted, ...rest } = production;
    expect(() => loadEnv(rest)).toThrow(/APP_URL is required in production/);
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow(
      /DATABASE_URL is required[\s\S]*AUTH_SECRET is required[\s\S]*APP_URL is required in production[\s\S]*DATABASE_OWNER_URL is required in production/,
    );
  });

  it('accepts an https APP_URL in production', () => {
    expect(loadEnv({ ...production, APP_URL: 'https://partners.cleanstart.com' }).APP_URL).toBe('https://partners.cleanstart.com');
  });

  it.each(['http://localhost:3004', 'http://127.0.0.1:3004', 'http://[::1]:3004'])(
    'accepts a loopback APP_URL in production for a local smoke test: %s',
    (APP_URL) => {
      expect(loadEnv({ ...production, APP_URL }).APP_URL).toBe(APP_URL);
    },
  );

  it('leaves an http APP_URL alone in development and test', () => {
    expect(loadEnv({ ...base, APP_URL: 'http://partners.example.test' }).APP_URL).toBe('http://partners.example.test');
    expect(loadEnv({ ...base, NODE_ENV: 'test', APP_URL: 'http://partners.example.test' }).NODE_ENV).toBe('test');
  });
});
