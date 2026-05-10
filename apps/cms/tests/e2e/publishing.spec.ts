import { expect, test } from '@playwright/test';

/**
 * Phase F — Publishing checklist.
 *
 * Scaffold spec — exercises the `robots.txt` route to verify the
 * publishing-related infrastructure is reachable end-to-end. Replace
 * with the real publishing-checklist gate flow once admin auth
 * fixtures land.
 */
test.describe('@phase-f-publishing', () => {
  test('robots.txt is served', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body).toMatch(/User-agent:/);
  });
});
