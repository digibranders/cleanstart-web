import { z } from 'zod';
import { assertDemoModeAllowed, isDemoMode } from './server/demo';
import { isHttpsOrLoopback } from './server/security/app-url';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const optionalString = z.string().min(1).optional();

/** Cloudflare's published always-pass Turnstile test keys. Used only when NODE_ENV is not 'production'. */
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    // Public origin of this app. Must match the dev port of the worktree (handoff table), no trailing slash.
    // Optional here so production can report an unset one with the other required variables; the transform applies the development default.
    APP_URL: z.string().url().optional(),

    // Database: portal_app for the running app, portal_owner for migrations only.
    // Optional in the object so a missing one does not stop the production checks below from running: superRefine
    // reports DATABASE_URL, AUTH_SECRET and the production variables together, and the transform restores the string type.
    DATABASE_URL: z.string().url().optional(),
    DATABASE_OWNER_URL: z.string().url().optional(),

    // Auth (Better Auth)
    AUTH_SECRET: z.string().min(32).optional(),

    // Agreement. 'draft-0' is the placeholder until legal supplies the text (BUILD-HANDOFF).
    PARTNER_AGREEMENT_VERSION: z.string().min(1).default('draft-0'),
    PARTNER_AGREEMENT_KEY: optionalString,

    // Email (Brevo). Unset in development: the transport logs and skips.
    BREVO_API_KEY: optionalString,
    BREVO_SENDER_EMAIL: z.string().email().optional(),
    PARTNERS_NOTIFY_EMAIL: z.string().email().optional(),

    // Private R2 bucket for documents. Unset in development: file features throw IntegrationError.
    R2_ENDPOINT: z.string().url().optional(),
    R2_BUCKET: optionalString,
    R2_ACCESS_KEY_ID: optionalString,
    R2_SECRET_ACCESS_KEY: optionalString,

    // HubSpot. Optional except in production, see superRefine.
    HUBSPOT_PORTAL_TOKEN: optionalString,
    HUBSPOT_PARTNER_PIPELINE_ID: optionalString,
    HUBSPOT_USE_ASSOCIATION_LABELS: bool.default('false'),
    // Not required in production: the portal polls and nothing subscribes to webhooks. The route answers 404 while this is unset.
    HUBSPOT_WEBHOOK_SECRET: optionalString,
    HUBSPOT_PORTAL_ID: optionalString,
    HUBSPOT_DEV_PORTAL_ID: optionalString,

    // Jobs run only in the long lived container (master D5, CMS PAYLOAD_AUTO_RUN pattern).
    // Defaults to false for development. deploy-portal.yml renders PORTAL_JOBS_ENABLED=true into the production env file when the GitHub variable is unset.
    PORTAL_JOBS_ENABLED: bool.default('false'),

    // Website application intake (M1.3b)
    CMS_API_URL: z.string().url().default('http://cms:3000'),
    CMS_INTAKE_API_KEY: optionalString,

    // Bot protection on /apply and the sign in help forms
    TURNSTILE_SECRET_KEY: optionalString,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalString,

    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ENVIRONMENT: z.string().default('development'),

    // Shared password gate in front of the hosted portal. It stays until launch; removing it is a launch step.
    PORTAL_REVIEW_PASSWORD: optionalString,

    // Demo mode (docs/partner-portal/DEMO.md). Read from the process environment by server/demo.ts; listed here so the variables are documented in one place.
    PORTAL_DEMO_MODE: optionalString,
    PORTAL_DEMO_DENY_HOSTS: optionalString,

    // Tests only. Never read by application code.
    PORTAL_TEST_DATABASE_URL: z.string().url().optional(),
    PORTAL_TEST_OWNER_URL: z.string().url().optional(),
  })
  .superRefine((value, ctx) => {
    for (const key of ['DATABASE_URL', 'AUTH_SECRET'] as const) {
      if (!value[key]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required` });
    }
    const demo = isDemoMode({ PORTAL_DEMO_MODE: value.PORTAL_DEMO_MODE });
    if (demo) {
      if (value.TURNSTILE_SECRET_KEY !== undefined && value.TURNSTILE_SECRET_KEY !== TURNSTILE_TEST_SECRET_KEY) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['TURNSTILE_SECRET_KEY'], message: "TURNSTILE_SECRET_KEY must be Cloudflare's test key in demo mode" });
      }
      if (value.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== undefined && value.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== TURNSTILE_TEST_SITE_KEY) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['NEXT_PUBLIC_TURNSTILE_SITE_KEY'], message: "NEXT_PUBLIC_TURNSTILE_SITE_KEY must be Cloudflare's test key in demo mode" });
      }
    }
    if (value.NODE_ENV !== 'production') return;
    if (demo && !value.PORTAL_REVIEW_PASSWORD) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['PORTAL_REVIEW_PASSWORD'], message: 'PORTAL_REVIEW_PASSWORD is required in demo mode, so a hosted demo is never open' });
    }
    if (value.APP_URL !== undefined && !isHttpsOrLoopback(value.APP_URL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['APP_URL'],
        message: `APP_URL must start with https:// in production (got ${value.APP_URL}); cookies, invite links and reset links would travel in the clear. Loopback hosts (localhost, 127.0.0.1, [::1]) are the only exception.`,
      });
    }
    // The demo swaps every outside service for a fake, so only what the app itself needs stays required.
    const required = demo
      ? (['APP_URL', 'DATABASE_OWNER_URL'] as const)
      : ([
          'APP_URL', 'DATABASE_OWNER_URL', 'BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'R2_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY_ID',
          'R2_SECRET_ACCESS_KEY', 'HUBSPOT_PORTAL_TOKEN', 'HUBSPOT_PARTNER_PIPELINE_ID',
          'TURNSTILE_SECRET_KEY', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'SENTRY_DSN',
        ] as const);
    for (const key of required) {
      if (!value[key]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required in production` });
    }
  })
  .transform((value) => ({
    ...value,
    APP_URL: value.APP_URL ?? 'http://localhost:3004',
    // superRefine has already failed the parse when either is missing, so these never fall back.
    DATABASE_URL: value.DATABASE_URL ?? '',
    AUTH_SECRET: value.AUTH_SECRET ?? '',
    // Demo mode never runs the scheduler: there is no real HubSpot, R2 or mail behind it to work on.
    PORTAL_JOBS_ENABLED: isDemoMode({ PORTAL_DEMO_MODE: value.PORTAL_DEMO_MODE }) ? false : value.PORTAL_JOBS_ENABLED,
    TURNSTILE_SECRET_KEY:
      value.TURNSTILE_SECRET_KEY ?? (value.NODE_ENV === 'production' && !isDemoMode({ PORTAL_DEMO_MODE: value.PORTAL_DEMO_MODE }) ? '' : TURNSTILE_TEST_SECRET_KEY),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      value.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? (value.NODE_ENV === 'production' && !isDemoMode({ PORTAL_DEMO_MODE: value.PORTAL_DEMO_MODE }) ? '' : TURNSTILE_TEST_SITE_KEY),
  }));

export type Env = z.output<typeof schema>;

export const loadEnv = (source: Record<string, string | undefined>): Env => {
  assertDemoModeAllowed(source);
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `${i.path.join('.') || 'env'}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return parsed.data;
};

export const env: Env = process.env.SKIP_ENV_VALIDATION === '1' ? ({} as Env) : loadEnv(process.env);
