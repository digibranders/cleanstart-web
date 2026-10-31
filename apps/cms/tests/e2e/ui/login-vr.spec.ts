import { expect, test } from '@playwright/test';

/**
 * Phase UI · visual-regression baseline.
 *
 * Runs against the login route only — no seeded fixtures needed. New
 * baselines are written on first run; subsequent runs diff against
 * them. No CI job runs this suite; run it locally with `--grep @phase-ui-vr`.
 *
 * Add new VR specs as primitives + views land in later waves; tag every
 * one `@phase-ui-vr` so the CI grep stays consistent.
 */
test.describe('@phase-ui-vr', () => {
  test('admin login renders pixel-stable', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });
});
