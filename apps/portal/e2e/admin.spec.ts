import { readFile } from 'node:fs/promises';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { KESTREL, OPEN_DOC, PERSONAS, RESTRICTED_DOC } from './support/env';
import { hydrated, openSearchPalette } from './support/ui';

/**
 * Types into the palette and returns the body of the server action's answer. The palette prints "Nothing matches" as
 * soon as the query is typed, before the server has answered, so the screen cannot prove an empty result: the body can.
 */
async function searchFor(page: Page, dialog: Locator, text: string): Promise<string> {
  // A server action is a POST to the page's own URL that carries a Next-Action header.
  const answered = page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === 'POST' && 'next-action' in request.headers() && (request.postData() ?? '').includes(text);
  });
  await dialog.getByRole('searchbox').fill(text);
  const body = await (await answered).text();
  // An error answer would also leave the list empty, so the answer must be a successful one.
  expect(body, `the search for "${text}" did not succeed`).toContain('"ok":true');
  return body;
}

/** The Audit log screen and the Ctrl K palette, as a partner manager and as a partner admin. */
test.describe('@portal audit log', () => {
  test.use({ storageState: PERSONAS.manager.file });

  test('lists events, filters through the URL and exports the filtered set', async ({ page }) => {
    await page.goto('/admin/audit');
    await hydrated(page);
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
    // Filtered: the seeded stage change is about another company and must not be in the file.
    expect(body).not.toContain('Vardhan Capital E2E');
    expect(body).not.toContain('Stage changed to Discovery');
  });

  test('opens an event in the drawer with its details', async ({ page }) => {
    await page.goto('/admin/audit');
    await hydrated(page);
    await page.getByRole('button', { name: 'Stage changed' }).first().click();
    await expect(page.getByText('Stage changed to Discovery')).toBeVisible();
    // Scoped to the drawer: the table row behind it also says CRM.
    await expect(page.getByLabel('Stage changed').getByText('CRM')).toBeVisible();
  });
});

test.describe('@portal search', () => {
  test.describe('as a partner manager', () => {
    test.use({ storageState: PERSONAS.manager.file });

    test('Ctrl K finds a partner and a deal by its customer', async ({ page }) => {
      await page.goto('/admin/approvals');
      const dialog = await openSearchPalette(page);
      await dialog.getByRole('searchbox').fill('kestrl');
      await expect(dialog.getByText(KESTREL)).toBeVisible();
      // Deals are found by customer name, not by the partner's name.
      await dialog.getByRole('searchbox').fill('vardhan');
      await expect(dialog.getByText('Vardhan Capital E2E')).toBeVisible();
      await dialog.getByRole('searchbox').press('Escape');
      await expect(dialog).toBeHidden();
    });

    test('Enter opens the first result', async ({ page }) => {
      await page.goto('/admin/approvals');
      const dialog = await openSearchPalette(page);
      await dialog.getByRole('searchbox').fill('kestrl');
      // Enter takes the first row that is on screen, so wait for the partner row before pressing it.
      await expect(dialog.getByText(KESTREL)).toBeVisible();
      await dialog.getByRole('searchbox').press('Enter');
      await expect(page).toHaveURL(/\/admin\/partners$/);
      await expect(dialog).toBeHidden();
    });
  });

  test.describe('as a partner admin of the same company', () => {
    test.use({ storageState: PERSONAS.kestrelAdmin.file });

    // The positive control for the test below: the same search, as the company that owns the deal, finds it.
    test('finds the company\'s own deal', async ({ page }) => {
      await page.goto('/partner/documents');
      const dialog = await openSearchPalette(page);
      expect(await searchFor(page, dialog, 'Vardhan')).toContain('Vardhan Capital E2E');
      await expect(dialog.getByText('Vardhan Capital E2E')).toBeVisible();
    });
  });

  test.describe('as a partner admin of another company', () => {
    test.use({ storageState: PERSONAS.arborAdmin.file });

    test('never returns another partner, its deals or its documents', async ({ page }) => {
      await page.goto('/partner/documents');
      const dialog = await openSearchPalette(page);
      // The answers are checked by body: a leaked name would be in it whatever the screen shows.
      expect(await searchFor(page, dialog, 'Vardhan')).not.toContain('Vardhan');
      await expect(dialog.getByText('Nothing matches')).toBeVisible();
      expect(await searchFor(page, dialog, 'Kestrel')).not.toContain('Kestrel');
      await expect(dialog.getByText(KESTREL)).toHaveCount(0);
      expect(await searchFor(page, dialog, 'playbook')).not.toContain(RESTRICTED_DOC);
    });

    test('still finds what its own audience may see', async ({ page }) => {
      await page.goto('/partner/documents');
      const dialog = await openSearchPalette(page);
      expect(await searchFor(page, dialog, 'datasheet')).toContain(OPEN_DOC);
      await expect(dialog.getByText(OPEN_DOC)).toBeVisible();
    });
  });
});
