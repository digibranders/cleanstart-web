// Environment for the Playwright run. Imported by the config, the global setup and every spec, so the test process,
// the helpers it imports from src/ and the Next dev server all see the same database and the same fakes.

import { fileURLToPath } from 'node:url';
import { definedInNextEnvFiles } from './env-files';

const PORT = 3290;
const DB = 'cleanstart_portal_e2e';
const APP_URL = `postgresql://portal_app:portal_app_dev@localhost:5432/${DB}`;
const OWNER_URL = `postgresql://portal_owner:portal_owner_dev@localhost:5432/${DB}`;

/** Variables that would make the app talk to a real service or turn on a gate. They are removed, not blanked, because an empty string fails validation. */
const SCRUBBED = [
  'PORTAL_REVIEW_PASSWORD',
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
  'PARTNERS_NOTIFY_EMAIL',
  'HUBSPOT_PORTAL_TOKEN',
  'HUBSPOT_PARTNER_PIPELINE_ID',
  'HUBSPOT_WEBHOOK_SECRET',
  'CMS_INTAKE_API_KEY',
  'TURNSTILE_SECRET_KEY',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  'HUBSPOT_PORTAL_ID',
  'HUBSPOT_DEV_PORTAL_ID',
  'PARTNER_AGREEMENT_KEY',
  'CMS_API_URL',
];
/** Also removed: SKIP_ENV_VALIDATION would switch the app's environment checks off. */
const FORBIDDEN = [...SCRUBBED, 'SKIP_ENV_VALIDATION'];
for (const key of FORBIDDEN) delete process.env[key];

/**
 * Deleting a key from process.env does not stop `next dev` from reading it out of the app's own env files, and an
 * empty value is rejected by env.ts. So the run refuses to start when any scrubbed key is defined in a file Next
 * loads in development (read with Next's own loader, see env-files.ts), instead of letting the app under test reach
 * a real service. Next never overrides a variable that is already set, so the explicit values in serverEnv below
 * cannot be replaced by those files.
 */
const appDir = fileURLToPath(new URL('../../', import.meta.url));
const definedInFiles = definedInNextEnvFiles(appDir, FORBIDDEN, fileURLToPath(import.meta.url));
if (definedInFiles.length > 0) {
  throw new Error(
    `The e2e run would let the app under test load real service settings from its env files: ${definedInFiles.join(', ')}. Remove or comment those lines (the e2e run supplies its own fakes), then run it again.`,
  );
}

const serverEnv: Record<string, string> = {
  NODE_ENV: 'development',
  APP_URL: `http://localhost:${PORT}`,
  DATABASE_URL: APP_URL,
  DATABASE_OWNER_URL: OWNER_URL,
  AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-1234',
  PORTAL_JOBS_ENABLED: 'false',
  // No proxy in front of the dev server: trust no forwarded header.
  PORTAL_TRUSTED_PROXY_HOPS: '0',
  // The env default (http://cms:3000) could resolve to the real CMS on a Docker network; nothing listens here.
  CMS_API_URL: 'http://localhost:9',
  // Presigned links are computed locally; nothing is ever sent to this address.
  R2_ENDPOINT: 'http://localhost:9',
  R2_BUCKET: 'e2e-docs',
  R2_ACCESS_KEY_ID: 'e2e-access-key',
  R2_SECRET_ACCESS_KEY: 'e2e-secret-key',
  // Cloudflare's published always-pass Turnstile site key. The matching secret is applied by env.ts outside production.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  // A separate build directory, so the e2e dev server never collides with a dev server in the same folder.
  NEXT_DIST_DIR: '.next-e2e',
  NEXT_TELEMETRY_DISABLED: '1',
};

// The helpers imported from src/ (test-helpers, repos, HubSpot code) read these in the test process.
Object.assign(process.env, serverEnv, {
  PORTAL_TEST_DATABASE_URL: APP_URL,
  PORTAL_TEST_OWNER_URL: OWNER_URL,
});

/** The run truncates this database. Refuse anything else, and anything that is not on this machine. */
export function assertE2eDatabase(url: string): void {
  const parsed = new URL(url);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (!local || parsed.pathname !== `/${DB}`) {
    throw new Error(`Refusing to reset ${parsed.hostname}${parsed.pathname}: the e2e run only touches ${DB} on this machine.`);
  }
}

export const E2E = {
  port: PORT,
  baseUrl: `http://localhost:${PORT}`,
  database: DB,
  serverEnv,
  pipelineId: 'pipe-e2e',
  /** Meets the password rule (8 or more characters, a letter, a number, a special character). Exists only in this throwaway database. */
  password: 'E2e-Passw0rd!x',
} as const;

export const PERSONAS = {
  manager: { email: 'manager@cleanstart.test', name: 'Omar E2E', file: 'e2e/.auth/manager.json' },
  marketing: { email: 'marketing@cleanstart.test', name: 'Ishita E2E', file: 'e2e/.auth/marketing.json' },
  kestrelAdmin: { email: 'aditi@kestrel-e2e.test', name: 'Aditi E2E', file: 'e2e/.auth/kestrel-admin.json' },
  kestrelSales: { email: 'vikram@kestrel-e2e.test', name: 'Vikram E2E', file: 'e2e/.auth/kestrel-sales.json' },
  kestrelTechnical: { email: 'meera@kestrel-e2e.test', name: 'Meera E2E', file: 'e2e/.auth/kestrel-technical.json' },
  arborAdmin: { email: 'priya@arbor-e2e.test', name: 'Priya E2E', file: 'e2e/.auth/arbor-admin.json' },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

export const KESTREL = 'Kestrel E2E';
export const ARBOR = 'Arbor E2E';
export const RESTRICTED_DOC = 'Kestrel only playbook';
export const OPEN_DOC = 'Open datasheet for every partner';
