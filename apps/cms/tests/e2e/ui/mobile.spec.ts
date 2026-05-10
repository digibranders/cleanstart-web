import { expect, test } from '@playwright/test';

/**
 * Phase UI · mobile breakpoint smoke.
 *
 * Runs in the `mobile-chrome` Playwright project (Pixel 7 viewport,
 * 412×915). Verifies the chrome doesn't collapse below the brand-card
 * width and that the login form remains usable.
 */
test.describe('@phase-ui-mobile', () => {
  test('login renders without horizontal overflow at Pixel 7 width', async ({ page }) => {
    await page.goto('/admin/login');
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow, 'Document should not horizontally overflow').toBe(false);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
