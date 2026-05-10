import { expect, test } from '@playwright/test';

/**
 * Phase UI · RTL smoke. Forces `dir="rtl"` on the document and re-runs
 * a basic visual sanity check on the login route. Future i18n locales
 * will reuse this as the regression baseline.
 */
test.describe('@phase-ui-rtl', () => {
  test('login renders under dir=rtl without breakage', async ({ page }) => {
    await page.goto('/admin/login');
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });
    await expect(page.locator('input[name="email"]')).toBeVisible();
    // Visual check — capture a snapshot so we get a baseline; promoted
    // to blocking once seeded fixtures land.
    await expect(page).toHaveScreenshot('login-rtl.png', { fullPage: true });
  });
});
