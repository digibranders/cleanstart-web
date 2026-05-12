import { expect, test } from '@playwright/test';

/**
 * Phase F — Publishing infrastructure.
 *
 * Tests robots.txt rules, sitemap endpoints, and JSON-LD schema output.
 * These are all read-only GET requests — no auth, no DB mutations.
 */
test.describe('@phase-f-publishing', () => {
  // ─── robots.txt ──────────────────────────────────────────────────────────

  test('robots.txt is served with correct content-type', async ({ request }) => {
    const res = await request.get('/api/robots.txt');
    expect(res.ok()).toBe(true);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/text\/plain/);
  });

  test('robots.txt contains User-agent directive', async ({ request }) => {
    const res = await request.get('/api/robots.txt');
    const body = await res.text();
    expect(body).toMatch(/User-agent:/i);
  });

  test('robots.txt contains Sitemap reference', async ({ request }) => {
    const res = await request.get('/api/robots.txt');
    const body = await res.text();
    expect(body).toMatch(/Sitemap:/i);
  });

  // ─── Sitemap ─────────────────────────────────────────────────────────────

  test('main sitemap.xml returns 200 with XML content-type', async ({ request }) => {
    const res = await request.get('/api/sitemap.xml');
    expect(res.ok()).toBe(true);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/application\/xml|text\/xml/);
  });

  test('main sitemap.xml contains urlset element', async ({ request }) => {
    const res = await request.get('/api/sitemap.xml');
    const body = await res.text();
    expect(body).toMatch(/<urlset/);
  });

  test('news sitemap returns 200 with XML content-type', async ({ request }) => {
    const res = await request.get('/api/sitemap-news.xml');
    expect(res.ok()).toBe(true);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/application\/xml|text\/xml/);
  });

  test('image sitemap returns 200 with XML content-type', async ({ request }) => {
    const res = await request.get('/api/sitemap-image.xml');
    expect(res.ok()).toBe(true);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/application\/xml|text\/xml/);
  });

  // ─── JSON-LD ──────────────────────────────────────────────────────────────

  test('JSON-LD endpoint rejects unknown collection with 400 or 404', async ({ request }) => {
    const res = await request.get('/api/jsonld/not-a-collection/some-slug');
    expect([400, 404]).toContain(res.status());
  });

  test('JSON-LD GET on known collection with missing slug returns 404', async ({ request }) => {
    const res = await request.get('/api/jsonld/blogs/__nonexistent-fixture-slug__');
    expect([404, 400]).toContain(res.status());
  });

  test('JSON-LD POST override endpoint requires auth', async ({ request }) => {
    const res = await request.post('/api/jsonld/blogs/some-slug', {
      data: { overrides: {} },
      headers: { 'content-type': 'application/json' },
    });
    // Must be auth-gated — unauthenticated requests must not succeed.
    expect([401, 403, 404]).toContain(res.status());
  });

  // ─── Publish checklist ────────────────────────────────────────────────────

  test('publish checklist endpoint requires auth', async ({ request }) => {
    const res = await request.get('/api/blogs/1/checklist');
    expect([401, 403]).toContain(res.status());
  });
});
