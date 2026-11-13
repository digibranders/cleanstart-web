import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test, type TestInfo } from '@playwright/test';
import { seededRegistrationId, seedInviteToken } from './support/db';
import { KESTREL, PERSONAS, type PersonaKey } from './support/env';
import { fillApplication, settled } from './support/ui';

/**
 * Accessibility: axe on every route as the role that uses it, then the keyboard behaviour axe cannot see.
 * Fails on serious and critical violations (WCAG 2.0 and 2.1, levels A and AA). Moderate and minor ones are attached
 * to the report so they can be triaged. Runs at desktop width and, through the `mobile` project, at 393 px.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface Group {
  as: PersonaKey | null;
  paths: string[];
}

/** ':seeded' stands for the id of the seeded Kestrel registration. */
const GROUPS: Group[] = [
  { as: null, paths: ['/sign-in', '/apply'] },
  {
    as: 'kestrelAdmin',
    paths: [
      '/partner/overview',
      '/partner/welcome',
      '/partner/deals',
      '/partner/deals/new',
      '/partner/deals/:seeded',
      '/partner/documents',
      '/partner/team',
      '/partner/company',
      '/partner/account',
    ],
  },
  { as: 'kestrelSales', paths: ['/partner/overview', '/partner/deals', '/partner/documents'] },
  { as: 'kestrelTechnical', paths: ['/partner/overview', '/partner/documents'] },
  { as: 'manager', paths: ['/admin/approvals', '/admin/partners', '/admin/documents', '/admin/reports', '/admin/team', '/admin/audit'] },
  { as: 'marketing', paths: ['/admin/documents'] },
];

async function scan(page: Page, label: string, testInfo: TestInfo): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const advisory = results.violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical');
  if (advisory.length > 0) {
    await testInfo.attach(`${label} advisory`, { body: JSON.stringify(advisory, null, 2), contentType: 'application/json' });
  }
  expect(
    blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`),
    label,
  ).toEqual([]);
}

for (const group of GROUPS) {
  test.describe(`@a11y axe, ${group.as ?? 'signed out'}`, () => {
    test.use({ storageState: group.as ? PERSONAS[group.as].file : { cookies: [], origins: [] } });
    for (const route of group.paths) {
      test(route, async ({ page }, testInfo) => {
        const path = route.replace(':seeded', route.includes(':seeded') ? await seededRegistrationId('Vardhan Capital E2E') : '');
        await page.goto(path);
        await settled(page);
        await scan(page, `${group.as ?? 'signed out'} ${path}`, testInfo);
      });
    }
  });
}

test.describe('@a11y axe, signed out flows that need data', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('/accept-invite with a valid invite', async ({ page }, testInfo) => {
    const token = await seedInviteToken(KESTREL, `axe-invitee-${Date.now()}@kestrel-e2e.test`);
    await page.goto(`/accept-invite?token=${encodeURIComponent(token)}`);
    await settled(page);
    await expect(page.locator('#name')).toBeVisible();
    await scan(page, 'signed out /accept-invite', testInfo);
  });

  test('/apply/done after an application', async ({ page }, testInfo) => {
    await fillApplication(page, {
      company: `Axe Applicant ${Date.now()} E2E`,
      website: 'axe-applicant-e2e.test',
      name: 'Axe Applicant',
      title: 'Alliances lead',
      email: `axe-${Date.now()}@axe-applicant-e2e.test`,
      phone: '+91 98765 43210',
    });
    await expect(page).toHaveURL(/\/apply\/done/);
    await settled(page);
    await scan(page, 'signed out /apply/done', testInfo);
  });
});

test.describe('@a11y keyboard', () => {
  test.use({ storageState: PERSONAS.kestrelAdmin.file });

  test('Ctrl K opens the palette with focus in the field, Tab stays inside, Escape returns focus', async ({ page }) => {
    await page.goto('/partner/overview');
    const trigger = page.locator('button.search');
    await trigger.focus();
    await page.keyboard.press('Control+K');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog.getByRole('searchbox')).toBeFocused();
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await scan(page, 'palette open', test.info());
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('every Tab stop on the deals page shows a focus indicator', async ({ page }) => {
    await page.goto('/partner/deals');
    const stops = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      // Compare the focused element's paint with the same element after it loses focus: if nothing changes,
      // a keyboard user cannot see where they are.
      const result = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        // The Next.js development overlay button is not part of the app.
        if (!el || el === document.body || el.tagName === 'NEXTJS-PORTAL') return null;
        const signature = (): string => {
          const s = getComputedStyle(el);
          return [s.outlineStyle, s.outlineWidth, s.boxShadow, s.backgroundColor, s.borderTopColor, s.color, s.textDecorationLine].join('|');
        };
        const focused = signature();
        el.blur();
        const blurred = signature();
        el.focus();
        return { tag: el.tagName, text: (el.textContent ?? '').trim().slice(0, 30), changed: focused !== blurred };
      });
      if (result) {
        stops.add(`${result.tag} ${result.text}`);
        expect(result.changed, `no visible focus indicator on ${result.tag} "${result.text}"`).toBe(true);
      }
    }
    expect(stops.size).toBeGreaterThan(10);
  });
});

test.describe('@a11y keyboard drawer', () => {
  test.use({ storageState: PERSONAS.manager.file });

  test('a drawer traps focus, closes on Escape and returns focus to what opened it', async ({ page }) => {
    // The partner Team screen invites from a card, not a drawer; the staff Team screen opens a drawer.
    await page.goto('/admin/team');
    const opener = page.getByRole('button', { name: /Invite/ }).first();
    await opener.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog').first();
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press('Tab');
      expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await scan(page, 'drawer open', test.info());
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
