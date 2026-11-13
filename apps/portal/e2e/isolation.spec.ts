import { expect, test } from '@playwright/test';
import { seededRegistrationId } from './support/db';
import { PERSONAS } from './support/env';

/**
 * Tenant isolation through the browser: another company's deal id must answer exactly like an id that does not
 * exist, so deal ids cannot be probed. The repository level matrix is in src/server/repo/isolation.test.ts.
 */
test.describe('@portal tenant isolation', () => {
  test.use({ storageState: PERSONAS.arborAdmin.file });

  test('a partner of another company gets the deal not found state for a Kestrel deal, the same as for a missing id', async ({ page }) => {
    const other = await seededRegistrationId('Vardhan Capital E2E');
    const denied = await page.goto(`/partner/deals/${other}`);
    await expect(page.getByRole('heading', { name: 'Deal not found' })).toBeVisible();
    const deniedText = await page.locator('main').innerText();
    const missing = await page.goto('/partner/deals/00000000-0000-4000-8000-000000000000');
    await expect(page.getByRole('heading', { name: 'Deal not found' })).toBeVisible();
    // The screen answers a deal it cannot show with its own "Deal not found" state (status 200 for both), so the
    // check is that the two answers cannot be told apart and the deal's customer never appears.
    expect(denied?.status()).toBe(missing?.status());
    expect(await page.locator('main').innerText()).toBe(deniedText);
    await expect(page.getByText('Vardhan Capital E2E')).toHaveCount(0);
  });
});
