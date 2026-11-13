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
});
