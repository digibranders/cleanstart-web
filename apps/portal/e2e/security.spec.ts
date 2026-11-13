import { expect, type Page, test } from '@playwright/test';
import { PERSONAS } from './support/env';
import { settled } from './support/ui';

/**
 * Security headers on real responses, and proof that the Content-Security-Policy does not break the app: the browser
 * reports every blocked resource as a securitypolicyviolation event, and none may happen on the main routes.
 * The development server serves the development policy ('unsafe-eval' allowed); the production policy is unit tested
 * in src/server/security/csp.test.ts and src/proxy.test.ts.
 */
const watchViolations = async (page: Page): Promise<() => Promise<string[]>> => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = seen;
    document.addEventListener('securitypolicyviolation', (event) => {
      seen.push(`${event.violatedDirective} blocked ${event.blockedURI || 'inline'}`);
    });
  });
  return () => page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
};

test.describe('@portal security headers', () => {
  test('a page response carries a nonce policy and the static protections', async ({ request }) => {
    const response = await request.get('/sign-in');
    const headers = response.headers();
    expect(headers['content-security-policy']).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('the nonce changes on every request', async ({ request }) => {
    const nonce = async (): Promise<string> =>
      /'nonce-([^']+)'/.exec((await request.get('/sign-in')).headers()['content-security-policy'] ?? '')?.[1] ?? '';
    expect(await nonce()).not.toBe(await nonce());
  });

  test('API routes answer with a closed policy', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.headers()['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
  });
});

test.describe('@portal csp does not block the app', () => {
  test('signed out pages', async ({ page }) => {
    const violations = await watchViolations(page);
    for (const path of ['/sign-in', '/apply']) {
      await page.goto(path);
      await settled(page);
    }
    expect(await violations()).toEqual([]);
  });

  test.describe('partner admin', () => {
    test.use({ storageState: PERSONAS.kestrelAdmin.file });
    test('overview, deals, documents, team, account and the search palette', async ({ page }) => {
      const violations = await watchViolations(page);
      for (const path of ['/partner/overview', '/partner/deals', '/partner/deals/new', '/partner/documents', '/partner/team', '/partner/account']) {
        await page.goto(path);
        await settled(page);
      }
      await page.keyboard.press('Control+K');
      await page.getByRole('searchbox').fill('Vardhan');
      await settled(page);
      expect(await violations()).toEqual([]);
    });
  });

  test.describe('partner manager', () => {
    test.use({ storageState: PERSONAS.manager.file });
    test('approvals, partners, documents, reports, team and audit', async ({ page }) => {
      const violations = await watchViolations(page);
      for (const path of ['/admin/approvals', '/admin/partners', '/admin/documents', '/admin/reports', '/admin/team', '/admin/audit']) {
        await page.goto(path);
        await settled(page);
      }
      expect(await violations()).toEqual([]);
    });
  });
});
