import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config — runs Playwright specs from `tests/e2e/`. Each spec is
 * tagged with the phase it covers (`@phase-d-preview`, `@phase-e-leads`,
 * `@phase-f-publishing`, `@phase-ui-vr`, `@phase-ui-a11y`,
 * `@phase-ui-keyboard`, `@phase-ui-mobile`, `@phase-ui-rtl`) so CI can
 * filter to a phase's gate suite via `--grep @phase-<x>`.
 *
 * Boot model: spawns the CMS dev server against the same Postgres the
 * CI workflow already provisions (`DATABASE_URI`). Local runs use the
 * developer's own Postgres.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.CMS_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      grep: /@phase-ui-mobile/,
    },
  ],
  webServer: process.env.CMS_BASE_URL
    ? undefined
    : {
        // CI: use the pre-built output so the server starts in seconds
        // and avoids JIT-compilation delay on first request.
        // Local: use dev server for fast iteration (no build step needed).
        command: process.env.CI ? 'pnpm start' : 'pnpm dev',
        url: 'http://localhost:3000/admin',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
