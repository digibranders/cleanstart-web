import { expect, type Page, test } from '@playwright/test';
import { PERSONAS } from './support/env';
import { expectRendered, openSearchPalette, settled } from './support/ui';

/**
 * Security headers on real responses, and proof that the Content-Security-Policy does not break the app: the browser
 * reports every blocked resource as a securitypolicyviolation event, and none may happen on the main routes.
 * The development server serves the development policy ('unsafe-eval' allowed); the production policy is unit tested
 * in src/server/security/csp.test.ts and src/proxy.test.ts.
 */
const CSP_NONCE = /script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/;

/**
 * Collects violations on the Node side. A page-side array would be reset by every navigation, because the init script
 * runs again in each new document, and the loops below visit many pages. The bound function survives navigation.
 */
const watchViolations = async (page: Page): Promise<string[]> => {
  const seen: string[] = [];
  await page.exposeFunction('reportCspViolation', (text: string) => {
    seen.push(text);
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      (window as unknown as { reportCspViolation: (text: string) => void }).reportCspViolation(
        `${event.violatedDirective} blocked ${event.blockedURI || 'inline'} on ${location.pathname}`,
      );
    });
  });
  return seen;
};

/** Opens a page, proves the document that loaded carried the nonce policy, and that it is the page asked for. */
async function visit(page: Page, path: string): Promise<void> {
  const response = await page.goto(path);
  expect(response?.headers()['content-security-policy'], `no nonce policy on the document for ${path}`).toMatch(CSP_NONCE);
  await settled(page);
  await expectRendered(page, path);
}

test.describe('@portal security headers', () => {
  test('a page response carries a nonce policy and the static protections', async ({ request }) => {
    const response = await request.get('/sign-in');
    const headers = response.headers();
    expect(headers['content-security-policy']).toMatch(CSP_NONCE);
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
  test('the collector sees a violation when there is one', async ({ page }) => {
    const violations = await watchViolations(page);
    await visit(page, '/sign-in');
    // img-src allows self, data and blob only. (An inline script would not do: 'strict-dynamic' trusts a script that a
    // trusted script, or the debugger, creates.)
    await page.evaluate(() => {
      new Image().src = 'http://localhost:9/csp-control.png';
    });
    await expect.poll(() => violations).toEqual(['img-src blocked http://localhost:9/csp-control.png on /sign-in']);
  });

  test('signed out pages', async ({ page }) => {
    const violations = await watchViolations(page);
    for (const path of ['/sign-in', '/apply']) await visit(page, path);
    expect(violations).toEqual([]);
  });

  test.describe('partner admin', () => {
    test.use({ storageState: PERSONAS.kestrelAdmin.file });
    test('overview, deals, documents, team, account and the search palette', async ({ page }) => {
      const violations = await watchViolations(page);
      for (const path of ['/partner/overview', '/partner/deals', '/partner/deals/new', '/partner/documents', '/partner/team', '/partner/account']) {
        await visit(page, path);
      }
      const dialog = await openSearchPalette(page);
      await dialog.getByRole('searchbox').fill('Vardhan');
      await expect(dialog.getByText('Vardhan Capital E2E')).toBeVisible();
      expect(violations).toEqual([]);
    });
  });

  test.describe('partner manager', () => {
    test.use({ storageState: PERSONAS.manager.file });
    test('approvals, partners, documents, reports, team and audit', async ({ page }) => {
      const violations = await watchViolations(page);
      for (const path of ['/admin/approvals', '/admin/partners', '/admin/documents', '/admin/reports', '/admin/team', '/admin/audit']) {
        await visit(page, path);
      }
      expect(violations).toEqual([]);
    });
  });
});
