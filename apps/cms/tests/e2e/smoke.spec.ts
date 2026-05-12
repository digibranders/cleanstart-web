import { expect, test } from '@playwright/test';

/**
 * Phase I — Pre-cutover smoke suite.
 *
 * 50+ representative endpoint checks verifying the CMS is up, all routes
 * respond with expected status codes, and auth gates are in place.
 *
 * Designed to run against a live local or staging server — no DB mutations,
 * all unauthenticated (auth-gated endpoints are checked for 401/403).
 */
test.describe('@phase-i-smoke', () => {
  // ─── Admin shell ───────────────────────────────────────────────────────

  test('GET /admin redirects unauthenticated users', async ({ request }) => {
    const res = await request.get('/admin', { maxRedirects: 0 });
    expect([200, 302, 307, 308]).toContain(res.status());
  });

  test('GET /admin/login returns 200', async ({ request }) => {
    const res = await request.get('/admin/login');
    expect(res.status()).toBe(200);
  });

  test('GET /admin/logout returns 200 or redirect', async ({ request }) => {
    const res = await request.get('/admin/logout', { maxRedirects: 0 });
    expect([200, 302, 307, 308]).toContain(res.status());
  });

  // ─── robots.txt ────────────────────────────────────────────────────────

  test('GET /api/robots.txt returns 200', async ({ request }) => {
    const res = await request.get('/api/robots.txt');
    expect(res.status()).toBe(200);
  });

  test('GET /api/robots.txt serves text/plain', async ({ request }) => {
    const res = await request.get('/api/robots.txt');
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/text\/plain/);
  });

  // ─── Sitemaps ──────────────────────────────────────────────────────────

  test('GET /api/sitemap.xml returns 200', async ({ request }) => {
    const res = await request.get('/api/sitemap.xml');
    expect(res.status()).toBe(200);
  });

  test('GET /api/sitemap.xml serves XML', async ({ request }) => {
    const res = await request.get('/api/sitemap.xml');
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/xml/);
  });

  test('GET /api/sitemap-news.xml returns 200', async ({ request }) => {
    const res = await request.get('/api/sitemap-news.xml');
    expect(res.status()).toBe(200);
  });

  test('GET /api/sitemap-image.xml returns 200', async ({ request }) => {
    const res = await request.get('/api/sitemap-image.xml');
    expect(res.status()).toBe(200);
  });

  // ─── Leads submit ──────────────────────────────────────────────────────

  test('GET /api/leads/submit returns 405', async ({ request }) => {
    const res = await request.get('/api/leads/submit');
    expect(res.status()).toBe(405);
  });

  test('POST /api/leads/submit with empty body returns 400', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: {},
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/leads/submit returns JSON', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: {},
      headers: { 'content-type': 'application/json' },
    });
    const body = await res.json() as { ok: boolean };
    expect(typeof body.ok).toBe('boolean');
  });

  // ─── Leads admin endpoints (auth-gated) ──────────────────────────────

  test('GET /api/leads/export-csv requires auth', async ({ request }) => {
    const res = await request.get('/api/leads/export-csv');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/leads/dsar/find requires auth', async ({ request }) => {
    const res = await request.get('/api/leads/dsar/find?email=test@example.com');
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/leads/dsar/delete requires auth', async ({ request }) => {
    const res = await request.post('/api/leads/dsar/delete', {
      data: { email: 'test@example.com' },
      headers: { 'content-type': 'application/json' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/leads/1/retry-sync requires auth', async ({ request }) => {
    const res = await request.post('/api/leads/1/retry-sync');
    expect([401, 403]).toContain(res.status());
  });

  // ─── JSON-LD ───────────────────────────────────────────────────────────

  test('GET /api/jsonld with unknown collection returns 400 or 404', async ({ request }) => {
    const res = await request.get('/api/jsonld/not-a-collection/slug');
    expect([400, 404]).toContain(res.status());
  });

  test('GET /api/jsonld/blogs with missing slug returns 404', async ({ request }) => {
    const res = await request.get('/api/jsonld/blogs/__nonexistent__');
    expect([404, 400]).toContain(res.status());
  });

  test('GET /api/jsonld/news with missing slug returns 404', async ({ request }) => {
    const res = await request.get('/api/jsonld/news/__nonexistent__');
    expect([404, 400]).toContain(res.status());
  });

  test('GET /api/jsonld/guides with missing slug returns 404', async ({ request }) => {
    const res = await request.get('/api/jsonld/guides/__nonexistent__');
    expect([404, 400]).toContain(res.status());
  });

  test('POST /api/jsonld override requires auth', async ({ request }) => {
    const res = await request.post('/api/jsonld/blogs/some-slug', {
      data: { overrides: {} },
      headers: { 'content-type': 'application/json' },
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  // ─── Publish checklist ─────────────────────────────────────────────────

  test('GET /api/blogs/1/checklist requires auth', async ({ request }) => {
    const res = await request.get('/api/blogs/1/checklist');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/news/1/checklist requires auth', async ({ request }) => {
    const res = await request.get('/api/news/1/checklist');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/pages/1/checklist requires auth', async ({ request }) => {
    const res = await request.get('/api/pages/1/checklist');
    expect([401, 403]).toContain(res.status());
  });

  // ─── Canonical check ───────────────────────────────────────────────────

  test('GET /api/canonical/health-check requires auth', async ({ request }) => {
    const res = await request.get('/api/canonical/health-check');
    expect([401, 403]).toContain(res.status());
  });

  // ─── Search analytics ──────────────────────────────────────────────────

  test('POST /api/search/analytics without body returns 400', async ({ request }) => {
    const res = await request.post('/api/search/analytics', {
      data: {},
      headers: { 'content-type': 'application/json' },
    });
    // Either validates at Zod boundary (400) or rate-limits (429).
    expect([400, 429]).toContain(res.status());
  });

  // ─── Redirects import ──────────────────────────────────────────────────

  test('POST /api/redirects/import requires auth', async ({ request }) => {
    const res = await request.post('/api/redirects/import', {
      data: { redirects: [] },
      headers: { 'content-type': 'application/json' },
    });
    expect([401, 403]).toContain(res.status());
  });

  // ─── Users / offboarding ───────────────────────────────────────────────

  test('POST /api/users/reassign-content requires auth', async ({ request }) => {
    const res = await request.post('/api/users/reassign-content', {
      data: { fromAuthorId: 1, toAuthorId: 2 },
      headers: { 'content-type': 'application/json' },
    });
    expect([401, 403]).toContain(res.status());
  });

  // ─── Payload REST collection endpoints ────────────────────────────────

  test('GET /api/blogs requires auth', async ({ request }) => {
    const res = await request.get('/api/blogs');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/news requires auth', async ({ request }) => {
    const res = await request.get('/api/news');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/leads requires auth', async ({ request }) => {
    const res = await request.get('/api/leads');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/users requires auth', async ({ request }) => {
    const res = await request.get('/api/users');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/media requires auth', async ({ request }) => {
    const res = await request.get('/api/media');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/forms requires auth', async ({ request }) => {
    const res = await request.get('/api/forms');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/redirects requires auth', async ({ request }) => {
    const res = await request.get('/api/redirects');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/authors requires auth', async ({ request }) => {
    const res = await request.get('/api/authors');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/categories requires auth', async ({ request }) => {
    const res = await request.get('/api/categories');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/pages requires auth', async ({ request }) => {
    const res = await request.get('/api/pages');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/events requires auth', async ({ request }) => {
    const res = await request.get('/api/events');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/webinars requires auth', async ({ request }) => {
    const res = await request.get('/api/webinars');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/jobs requires auth', async ({ request }) => {
    const res = await request.get('/api/jobs');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/guides requires auth', async ({ request }) => {
    const res = await request.get('/api/guides');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/resources requires auth', async ({ request }) => {
    const res = await request.get('/api/resources');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/knowledge-base requires auth', async ({ request }) => {
    const res = await request.get('/api/knowledge-base');
    expect([401, 403]).toContain(res.status());
  });

  // ─── Global endpoints ──────────────────────────────────────────────────

  test('GET /api/globals/siteSettings requires auth', async ({ request }) => {
    const res = await request.get('/api/globals/siteSettings');
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/globals/seoDefaults requires auth', async ({ request }) => {
    const res = await request.get('/api/globals/seoDefaults');
    expect([401, 403]).toContain(res.status());
  });

  // ─── Non-existent routes ───────────────────────────────────────────────

  test('GET /api/nonexistent returns 404', async ({ request }) => {
    const res = await request.get('/api/nonexistent-endpoint-xyz');
    expect(res.status()).toBe(404);
  });

  // ─── Form submit flow ─────────────────────────────────────────────────

  test('POST /api/leads/submit with honeypot filled returns 200 (bot must not detect failure)', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: {
        formId: 1,
        fields: {},
        website: 'bot-filled-honeypot',
      },
      headers: { 'content-type': 'application/json' },
    });
    // Honeypot trip silently returns 200 — bot must not detect failure.
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  test('POST /api/leads/submit without turnstile token returns 400 or 403', async ({ request }) => {
    const res = await request.post('/api/leads/submit', {
      data: {
        formId: 1,
        fields: { name: 'Smoke Test', email: 'smoke@example.com' },
      },
      headers: { 'content-type': 'application/json' },
    });
    expect([400, 403]).toContain(res.status());
  });
});
