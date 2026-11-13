import { defineConfig, devices } from '@playwright/test';
import { E2E } from './e2e/support/env';

/**
 * Portal E2E (`@portal`) and accessibility (`@a11y`) suites.
 *
 * Boot model: Playwright starts `next dev` on its own port with its own build directory against the
 * cleanstart_portal_e2e database (create it with scripts/db-create.sh). The dev server runs in development mode on
 * purpose: production mode requires the real Brevo, R2 and HubSpot variables. In development the email transport
 * logs and skips, R2 links are only computed, Turnstile uses Cloudflare's test keys, and background jobs are off.
 * HubSpot is the in-memory FakeHubspot driven from the test process (e2e/support/hubspot.ts).
 *
 * localhost, never 127.0.0.1: a dev server reached by IP does not hydrate (see apps/portal docs).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Never retry: the serial journey cannot start again in a fresh worker without re-seeding the database.
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: E2E.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    // Set PORTAL_E2E_CHANNEL=chrome to use the installed Chrome when the Playwright browser cache is missing.
    ...(process.env.PORTAL_E2E_CHANNEL ? { channel: process.env.PORTAL_E2E_CHANNEL } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@a11y axe/ },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${E2E.port}`,
    url: `${E2E.baseUrl}/api/health`,
    env: E2E.serverEnv,
    // Never reuse and never kill: if the port is busy the run stops with a clear error.
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
  },
});
