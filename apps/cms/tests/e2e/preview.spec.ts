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
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
