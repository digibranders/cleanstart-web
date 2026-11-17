import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from './env';
import { DemoModeError } from './server/demo';

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

  it('does not require HUBSPOT_WEBHOOK_SECRET in production', () => {
    const { HUBSPOT_WEBHOOK_SECRET: _omitted, ...rest } = production;
    expect(loadEnv(rest).HUBSPOT_WEBHOOK_SECRET).toBeUndefined();
  });

  it('still names the other required variables when HUBSPOT_WEBHOOK_SECRET is unset', () => {
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow(
      /DATABASE_URL is required[\s\S]*AUTH_SECRET is required[\s\S]*APP_URL is required in production[\s\S]*DATABASE_OWNER_URL is required in production/,
    );
    expect(() => loadEnv({ NODE_ENV: 'production' })).not.toThrow(/HUBSPOT_WEBHOOK_SECRET/);
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

describe('loadEnv in demo mode', () => {
  const hosted = 'postgresql://portal_app:pw@ep-demo-123.eu-central-1.aws.neon.tech/portal?sslmode=require';
  const demo = {
    ...base,
    PORTAL_DEMO_MODE: '1',
    NODE_ENV: 'production',
    APP_URL: 'https://portal-demo.example.net',
    DATABASE_URL: hosted,
    DATABASE_OWNER_URL: hosted,
    PORTAL_REVIEW_PASSWORD: 'review-password-16',
    PORTAL_DEMO_DATABASE_HOSTS: 'neon.tech',
  };

  it('needs none of the real integrations in production', () => {
    const env = loadEnv(demo);
    expect(env.NODE_ENV).toBe('production');
    expect(env.R2_BUCKET).toBeUndefined();
    expect(env.BREVO_API_KEY).toBeUndefined();
    expect(env.HUBSPOT_PORTAL_TOKEN).toBeUndefined();
    expect(env.SENTRY_DSN).toBeUndefined();
  });

  it('relaxes nothing when the switch is not exactly 1', () => {
    for (const PORTAL_DEMO_MODE of [undefined, '', '0', 'true']) {
      expect(() => loadEnv({ ...demo, PORTAL_DEMO_MODE }), String(PORTAL_DEMO_MODE)).toThrow(/R2_BUCKET is required in production[\s\S]*SENTRY_DSN is required in production/);
    }
  });

  it('still requires what the demo itself uses', () => {
    const { APP_URL: _app, ...rest } = demo;
    expect(() => loadEnv(rest)).toThrow(/APP_URL is required in production/);
    expect(() => loadEnv({ ...demo, APP_URL: 'http://portal-demo.example.net' })).toThrow(/APP_URL must start with https/);
  });

  it('does not need DATABASE_OWNER_URL to run, but the real portal still does', () => {
    const { DATABASE_OWNER_URL: _owner, ...rest } = demo;
    expect(loadEnv(rest).DATABASE_OWNER_URL).toBeUndefined();
    const { DATABASE_OWNER_URL: _realOwner, ...realRest } = production;
    expect(() => loadEnv(realRest)).toThrow(/DATABASE_OWNER_URL is required in production/);
  });

  it('checks a DATABASE_OWNER_URL that is present', () => {
    expect(() => loadEnv({ ...demo, DATABASE_OWNER_URL: 'postgresql://portal_owner:pw@elsewhere.neon.tech/portal' })).toThrow(/same host, port and database/);
  });

  it('treats an empty switch or host list as off in every mode, never as a parse failure', () => {
    expect(loadEnv({ ...production, PORTAL_DEMO_MODE: '', PORTAL_DEMO_DENY_HOSTS: '', PORTAL_DEMO_DATABASE_HOSTS: '' }).NODE_ENV).toBe('production');
    expect(loadEnv({ ...base, PORTAL_DEMO_MODE: '', PORTAL_DEMO_DENY_HOSTS: '', PORTAL_DEMO_DATABASE_HOSTS: '' }).NODE_ENV).toBe('development');
  });

  it('refuses real service credentials in demo mode', () => {
    expect(() => loadEnv({ ...demo, BREVO_API_KEY: 'k' })).toThrow(/BREVO_API_KEY is set/);
  });

  it('requires the review password in production, so a hosted demo is never open', () => {
    const { PORTAL_REVIEW_PASSWORD: _password, ...rest } = demo;
    expect(() => loadEnv(rest)).toThrow(/PORTAL_REVIEW_PASSWORD is required in demo mode/);
    expect(() => loadEnv({ ...demo, PORTAL_REVIEW_PASSWORD: 'x'.repeat(15) })).toThrow(/at least 16 characters/);
  });

  it('enforces the guard rules even with SKIP_ENV_VALIDATION, because the guard reads the raw environment', async () => {
    const { assertDemoModeAllowed } = await import('./server/demo');
    expect(() => assertDemoModeAllowed({ ...demo, SKIP_ENV_VALIDATION: '1', PORTAL_REVIEW_PASSWORD: 'short' })).toThrow(/PORTAL_REVIEW_PASSWORD/);
    expect(() => assertDemoModeAllowed({ ...demo, SKIP_ENV_VALIDATION: '1', TURNSTILE_SECRET_KEY: 'real' })).toThrow(/TURNSTILE_SECRET_KEY/);
  });

  it('uses Cloudflare test Turnstile keys and refuses any other', () => {
    const env = loadEnv(demo);
    expect(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY).toBe('1x00000000000000000000AA');
    expect(env.TURNSTILE_SECRET_KEY).toBe('1x0000000000000000000000000000000AA');
    expect(loadEnv({ ...demo, TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' }).TURNSTILE_SECRET_KEY).toBe('1x0000000000000000000000000000000AA');
    expect(() => loadEnv({ ...demo, TURNSTILE_SECRET_KEY: '0x4AAAAAAAreal' })).toThrow(/TURNSTILE_SECRET_KEY must be Cloudflare's test key in demo mode/);
    expect(() => loadEnv({ ...demo, NEXT_PUBLIC_TURNSTILE_SITE_KEY: '0x4AAAAAAAreal' })).toThrow(/NEXT_PUBLIC_TURNSTILE_SITE_KEY must be Cloudflare's test key in demo mode/);
  });

  it('turns the job scheduler off whatever PORTAL_JOBS_ENABLED says', () => {
    expect(loadEnv({ ...demo, PORTAL_JOBS_ENABLED: 'true' }).PORTAL_JOBS_ENABLED).toBe(false);
    expect(loadEnv({ ...production, PORTAL_JOBS_ENABLED: 'true' }).PORTAL_JOBS_ENABLED).toBe(true);
  });

  it('refuses to start where the real portal could be, before anything else is checked', () => {
    expect(() => loadEnv({ ...demo, DATABASE_URL: 'postgresql://portal_app:pw@postgres:5432/cleanstart_portal' })).toThrow(DemoModeError);
    expect(() => loadEnv({ ...demo, DATABASE_URL: 'postgresql://portal_app:pw@localhost:5432/d' })).toThrow(/Demo mode refused/);
    expect(() => loadEnv({ ...demo, APP_URL: 'https://partners.cleanstart.com' })).toThrow(/Demo mode refused/);
    expect(() => loadEnv({ ...demo, PORTAL_DEMO_DENY_HOSTS: 'ep-demo-123.eu-central-1.aws.neon.tech' })).toThrow(/deny list/);
  });

  it('allows a local database outside production, for development and tests', () => {
    expect(loadEnv({ ...base, PORTAL_DEMO_MODE: '1' }).NODE_ENV).toBe('development');
  });
});
