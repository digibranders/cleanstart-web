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
    // On a fresh CI Postgres the auth path redirects to
    // /admin/create-first-user (no seeded admin yet); on a primed DB
    // it stays on /admin/login. Both expose `input[name="email"]`,
    // and either is a valid "admin shell booted" signal for this
    // smoke spec.
    await expect(page).toHaveURL(/\/admin\/(login|create-first-user)/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
