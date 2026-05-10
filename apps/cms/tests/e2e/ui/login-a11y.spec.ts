import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Phase UI · accessibility baseline.
 *
 * Runs axe-core against unauthenticated routes. Wave 8 promotes this
 * job to blocking. Add new specs as views are rebuilt; tag every one
 * `@phase-ui-a11y`.
 */
test.describe('@phase-ui-a11y', () => {
  test('admin login has no critical a11y violations', async ({ page }) => {
    await page.goto('/admin/login');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
});
