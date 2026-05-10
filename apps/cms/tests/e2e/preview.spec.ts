import { expect, test } from '@playwright/test';

/**
 * Phase D — Preview workflow.
 *
 * Smoke-tests that the admin shell boots and serves the login page. A
 * full draft-preview round-trip needs a seeded admin user + collection
 * fixture; this scaffold spec verifies the harness is wired before
 * those land.
 */
test.describe('@phase-d-preview', () => {
  test('admin login page renders', async ({ page }) => {
    await page.goto('/admin/login');
    // The admin shell booting is the smoke signal here — Payload may
    // redirect to /admin/create-first-user on a fresh CI Postgres or
    // stay on /admin/login on a primed one. Both expose
    // `input[name="email"]`. We deliberately don't assert URL: the
    // sub-route is irrelevant for "the admin shell starts and serves
    // an auth form" coverage.
    await expect(page.locator('input[name="email"]').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
