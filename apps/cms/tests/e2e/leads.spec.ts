import { expect, test } from '@playwright/test';

/**
 * Phase E — Leads.
 *
 * Tests the public /api/leads/submit endpoint:
 *   - Empty body → 400 (Zod boundary rejects)
 *   - Honeypot field filled → 200 (silently accepted, anti-bot)
 *   - Turnstile token absent → 403 (challenge required)
 *   - GET on submit → 405 (method not allowed)
 */
test.describe('@phase-e-leads', () => {
  test('submit-lead rejects empty body with 400', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: {},
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json() as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
  });

  test('submit-lead accepts honeypot trip with 200 (anti-bot — bot must not detect failure)', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: {
        formId: 1,
        fields: {},
        website: 'bot-filled-this',
      },
      headers: { 'content-type': 'application/json' },
    });
    // Bot gets 200 regardless of honeypot — it must not detect it tripped.
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  test('submit-lead without turnstile token returns 403', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: {
        formId: 1,
        fields: { name: 'Test User', email: 'test@example.com' },
        // No turnstileToken — will fail challenge verification.
      },
      headers: { 'content-type': 'application/json' },
    });
    // Turnstile verification fails when token is absent / invalid.
    expect([400, 403]).toContain(res.status());
  });

  test('GET on submit-lead returns 405', async ({ request }) => {
    const res = await request.get('/api/leads/submit');
    expect(res.status()).toBe(405);
  });

  test('DSAR find endpoint requires auth', async ({ request }) => {
    const res = await request.get('/api/leads/dsar/find?email=test@example.com');
    expect([401, 403]).toContain(res.status());
  });

  test('DSAR delete endpoint requires auth', async ({ request }) => {
    const res = await request.post('/api/leads/dsar/delete', {
      data: { email: 'test@example.com' },
      headers: { 'content-type': 'application/json' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('retry-sync endpoint requires auth', async ({ request }) => {
    const res = await request.post('/api/leads/1/retry-sync');
    expect([401, 403]).toContain(res.status());
  });

  test('CSV export endpoint requires auth', async ({ request }) => {
    const res = await request.get('/api/leads/export-csv');
    expect([401, 403]).toContain(res.status());
  });
});
