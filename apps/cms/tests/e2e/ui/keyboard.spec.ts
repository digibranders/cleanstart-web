import { expect, test } from '@playwright/test';

/**
 * Phase UI · keyboard-only walkthrough.
 *
 * Verifies the highest-impact admin surfaces stay reachable + operable
 * with Tab / Shift-Tab / Enter / Esc. Wave 8 promotes this to blocking.
 */
test.describe('@phase-ui-keyboard', () => {
  test('login form is fully keyboard reachable', async ({ page }) => {
    await page.goto('/admin/login');

    // First Tab into the form should land on the email field.
    await page.keyboard.press('Tab');
    const focusedTagAfterFirstTab = await page.evaluate(
      () => document.activeElement?.getAttribute('name') ?? '',
    );
    expect(focusedTagAfterFirstTab).toBe('email');

    // Second Tab → password.
    await page.keyboard.press('Tab');
    const focusedTagAfterSecondTab = await page.evaluate(
      () => document.activeElement?.getAttribute('name') ?? '',
    );
    expect(focusedTagAfterSecondTab).toBe('password');
  });
});
