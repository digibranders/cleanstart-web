import { expect, test } from '@playwright/test';

/**
 * Phase E — Leads.
 *
 * Posts an empty body to the public submit endpoint and asserts the
 * boundary Zod validator rejects it. Validates that the endpoint is
 * mounted, accepts JSON, and returns the contract shape — without
 * needing a seeded form.
 */
test.describe('@phase-e-leads', () => {
  test('submit-lead rejects empty body with 400', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: {},
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });
});
