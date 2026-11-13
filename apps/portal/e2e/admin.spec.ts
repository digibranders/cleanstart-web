import { readFile } from 'node:fs/promises';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { KESTREL, PERSONAS } from './support/env';

/** Types into the palette and waits for the server action's answer, so an empty list is the real answer. */
async function searchFor(page: Page, dialog: Locator, text: string): Promise<void> {
  const answered = page.waitForResponse((response) => response.request().method() === 'POST');
  await dialog.getByRole('searchbox').fill(text);
  await answered;
}

/** The Audit log screen and the Ctrl K palette, as a partner manager and as a partner admin. */
test.describe('@portal audit log', () => {
  test.use({ storageState: PERSONAS.manager.file });

  test('lists events, filters through the URL and exports the filtered set', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'HubSpot sync' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stage changed' }).first()).toBeVisible();

    await page.getByLabel('Search', { exact: true }).fill('Kestrel');
    await expect(page).toHaveURL(/q=Kestrel/);
    await expect(page.getByRole('button', { name: 'Added partner' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stage changed' })).toHaveCount(0);

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
    expect(download.suggestedFilename()).toBe('cleanstart-audit-log.csv');
    const body = await readFile(await download.path(), 'utf8');
    expect(body.split('\n')[0]).toBe('"When","Who","Role","Action","On","Source","Details"');
    expect(body).toContain(KESTREL);
  });

  test('opens an event in the drawer with its details', async ({ page }) => {
    await page.goto('/admin/audit');
    await page.getByRole('button', { name: 'Stage changed' }).first().click();
    await expect(page.getByText('Stage changed to Discovery')).toBeVisible();
    // Scoped to the drawer: the table row behind it also says CRM.
    await expect(page.getByLabel('Stage changed').getByText('CRM')).toBeVisible();
  });
});

test.describe('@portal search', () => {
  test.describe('as a partner manager', () => {
    test.use({ storageState: PERSONAS.manager.file });

    test('Ctrl K finds a partner and Enter opens the first result', async ({ page }) => {
      await page.goto('/admin/approvals');
      await page.keyboard.press('Control+K');
      const dialog = page.getByRole('dialog', { name: 'Search' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('searchbox').fill('kestrl');
      await expect(dialog.getByText(KESTREL)).toBeVisible();
      // Deals are found by customer name, not by the partner's name.
      await dialog.getByRole('searchbox').fill('vardhan');
      await expect(dialog.getByText('Vardhan Capital E2E')).toBeVisible();
      await dialog.getByRole('searchbox').press('Escape');
      await expect(dialog).toBeHidden();
    });
  });

  test.describe('as a partner admin of another company', () => {
    test.use({ storageState: PERSONAS.arborAdmin.file });

    test('never returns another partner or its deals', async ({ page }) => {
      await page.goto('/partner/documents');
      await page.keyboard.press('Control+K');
      const dialog = page.getByRole('dialog', { name: 'Search' });
      await searchFor(page, dialog, 'Vardhan');
      await expect(dialog.getByText('Nothing matches')).toBeVisible();
      await searchFor(page, dialog, 'Kestrel');
      await expect(dialog.getByText(KESTREL)).toHaveCount(0);
    });
  });
});
