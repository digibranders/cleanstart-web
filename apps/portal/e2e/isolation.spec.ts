import { expect, test } from '@playwright/test';
import { seededRegistrationId } from './support/db';
import { PERSONAS } from './support/env';

/**
 * Tenant isolation through the browser: another company's deal id must answer exactly like an id that does not
 * exist, so deal ids cannot be probed. The repository level matrix is in src/server/repo/isolation.test.ts.
 */
test.describe('@portal tenant isolation', () => {
  test.use({ storageState: PERSONAS.arborAdmin.file });

  test("a partner of another company gets a 404 for a Kestrel deal, the same as for a missing id", async ({ page }) => {
    const other = await seededRegistrationId('Vardhan Capital E2E');
    const denied = await page.goto(`/partner/deals/${other}`);
    const missing = await page.goto('/partner/deals/00000000-0000-4000-8000-000000000000');
    expect(denied?.status()).toBe(404);
    expect(missing?.status()).toBe(404);
    await expect(page.getByText('Vardhan Capital E2E')).toHaveCount(0);
  });
});
