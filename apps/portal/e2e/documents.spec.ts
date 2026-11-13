import { expect, test } from '@playwright/test';
import { documentIdByTitle } from './support/db';
import { OPEN_DOC, PERSONAS, RESTRICTED_DOC } from './support/env';

/**
 * Document access. The seeded "Kestrel only playbook" is open to Kestrel alone. A partner outside its audience must
 * get the same 404 as for an id that does not exist, so file ids cannot be probed, and must not see it listed.
 * Download links are computed locally (no R2 request is made): the test reads the redirect and never follows it.
 */
test.describe('@portal documents', () => {
  test.describe('a partner outside the audience', () => {
    test.use({ storageState: PERSONAS.arborAdmin.file });

    test('gets a 404 for the file, identical to a missing id', async ({ request }) => {
      const id = await documentIdByTitle(RESTRICTED_DOC);
      const denied = await request.get(`/api/files/${id}`, { maxRedirects: 0 });
      const missing = await request.get('/api/files/00000000-0000-4000-8000-000000000000', { maxRedirects: 0 });
      expect(denied.status()).toBe(404);
      expect(missing.status()).toBe(404);
      expect(await denied.text()).toBe(await missing.text());
    });

    test('does not see the document in the library, but sees the open one', async ({ page }) => {
      await page.goto('/partner/documents');
      await expect(page.getByText(OPEN_DOC).first()).toBeVisible();
      await expect(page.getByText(RESTRICTED_DOC)).toHaveCount(0);
    });
  });

  test.describe('a partner inside the audience', () => {
    test.use({ storageState: PERSONAS.kestrelAdmin.file });

    test('is sent to a short lived download link and never sees the storage key', async ({ request }) => {
      const id = await documentIdByTitle(RESTRICTED_DOC);
      const response = await request.get(`/api/files/${id}`, { maxRedirects: 0 });
      expect(response.status()).toBe(302);
      const location = response.headers().location ?? '';
      expect(location).toContain('localhost:9');
      expect(location).toMatch(/X-Amz-Expires=\d+/);
      expect(Number(/X-Amz-Expires=(\d+)/.exec(location)?.[1])).toBeLessThanOrEqual(60);
      expect(await response.text()).not.toContain('documents/');
    });

    test('sees the document in the library', async ({ page }) => {
      await page.goto('/partner/documents');
      await expect(page.getByText(RESTRICTED_DOC).first()).toBeVisible();
    });
  });

  test.describe('signed out', () => {
    test('is turned away from the file route', async ({ request }) => {
      const id = await documentIdByTitle(OPEN_DOC);
      const response = await request.get(`/api/files/${id}`, { maxRedirects: 0 });
      expect([401, 302, 307, 404]).toContain(response.status());
      expect(response.headers().location ?? '').not.toContain('localhost:9');
    });
  });
});
