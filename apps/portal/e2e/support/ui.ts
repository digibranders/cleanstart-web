import { expect, type Locator, type Page } from '@playwright/test';
import { E2E } from './env';

/**
 * Every label and role name the specs click lives in this file. The names are the ones the screens carry in the
 * mock (commit 58747992, markup unchanged by the conversion). If a screen renames something, fix it here once.
 */
export async function signInThroughTheForm(page: Page, email: string, password: string = E2E.password): Promise<void> {
  await page.goto('/sign-in');
  await hydrated(page);
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

export async function signIn(page: Page, email: string): Promise<void> {
  await signInThroughTheForm(page, email);
  await page.waitForURL(/\/(partner|admin)\//);
}

export interface ApplicantInput {
  company: string;
  website: string;
  name: string;
  title: string;
  email: string;
  phone: string;
}

export async function fillApplication(page: Page, a: ApplicantInput): Promise<void> {
  await page.goto('/apply');
  await hydrated(page);
  await page.locator('#ap-company').fill(a.company);
  await page.locator('#ap-site').fill(a.website);
  await page.locator('#ap-name').fill(a.name);
  await page.locator('#ap-title').fill(a.title);
  await page.locator('#ap-email').fill(a.email);
  await page.locator('#ap-phone').fill(a.phone);
  // The phone layout shortens the option to "Channel" (UX WP5), the desktop one says "Channel partner".
  await page.getByRole('button', { name: /^Channel( partner)?$/ }).click();
  await page.getByRole('button', { name: 'India', exact: true }).click();
  await page.locator('#ap-how').fill('Found CleanStart through a customer evaluation.');
  // The always-pass widget needs a moment to issue its token; submitting earlier shows "Confirm you are not a robot".
  await page.waitForFunction(() => Boolean((document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value));
  await page.getByRole('button', { name: 'Submit application' }).click();
}

export async function openApplicationsTab(page: Page): Promise<void> {
  await page.goto('/admin/partners');
  await hydrated(page);
  await page.getByRole('button', { name: /Applications/ }).click();
}

export async function acceptInvite(page: Page, name: string, password: string = E2E.password): Promise<void> {
  await hydrated(page);
  await page.locator('#name').fill(name);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('checkbox', { name: /I accept the partner agreement/ }).check();
  await page.getByRole('button', { name: 'Accept and continue' }).click();
}

export interface DealInput {
  customer: string;
  contactName: string;
  contactEmail: string;
  product: 'CleanStart Images' | 'Clean Libraries' | 'CleanSight';
}

export async function registerDeal(page: Page, d: DealInput): Promise<void> {
  await page.goto('/partner/deals/new');
  await hydrated(page);
  await page.locator('#customer').fill(d.customer);
  await page.locator('#contact').fill(d.contactName);
  await page.locator('#cemail').fill(d.contactEmail);
  await page.getByRole('button', { name: new RegExp(d.product) }).click();
  await page.getByRole('button', { name: 'India', exact: true }).click();
  await page.getByRole('button', { name: 'Submit for approval' }).click();
  // Wait for the server's answer; navigating away first would abort the action and race the registration insert.
  await page.getByText(/Submitted for approval|sent for approval/).first().waitFor();
}

/**
 * Waits for the page to be quiet without insisting on it: the Turnstile widget on /apply keeps a connection open, so
 * `networkidle` never arrives there. After the grace period the page is scanned as it is.
 */
export async function settled(page: Page): Promise<void> {
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
}

export const acceptButton = (page: Page, customer: string, partner: string) =>
  page.getByRole('button', { name: `Accept ${customer} from ${partner}` });

/**
 * The page the browser ended on, as a path. A scan or a loop over routes means nothing if a redirect (an expired
 * session, a role that may not open the page) landed it somewhere else, so callers compare this with the route.
 */
export const pathOf = (page: Page): string => new URL(page.url()).pathname;

/**
 * Fails unless the page ended on `path` and rendered a main landmark (the sign-in and error pages have one too).
 * Callers that just navigated call `settled` first: a page that streams its answer redirects after `goto` returned.
 */
export async function expectRendered(page: Page, path: string): Promise<void> {
  expect(pathOf(page), `ended on ${page.url()} instead of ${path}`).toBe(path);
  await expect(page.locator('main').first()).toBeVisible();
}

/** Waits for a redirect that arrives after `goto` returned (a streamed page redirects from the client), then checks the page. */
export async function expectRedirectedTo(page: Page, path: string): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === path);
  await expectRendered(page, path);
}

/**
 * Waits until every button in the page's main area is wired to React. `goto` resolves at `load`, a moment before
 * hydration is done, and a click that lands earlier does nothing. Buttons only: the Turnstile widget adds inputs
 * that React does not own.
 */
export async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('main button'));
    return Boolean(document.querySelector('main')) && buttons.every((b) => Object.keys(b).some((k) => k.startsWith('__reactProps$')));
  });
}

/**
 * Opens the Ctrl K palette. The key handler is registered in an effect, so a press right after `goto` can arrive
 * before it exists; the press is repeated until the dialog shows. A press on an open palette only opens it again.
 * `from` is focused before every press so the palette remembers it as the element to give focus back to.
 */
export async function openSearchPalette(page: Page, from?: Locator): Promise<Locator> {
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await expect(async () => {
    await from?.focus();
    await page.keyboard.press('Control+K');
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass();
  return dialog;
}

/**
 * Waits until nothing on the page is mid-animation and no loading skeleton is showing. The content area fades in over
 * 0.22 s (opacity from 0) and the overlays fade in over 0.16 to 0.18 s, and axe reads the colour as painted at that
 * instant: text at half opacity fails contrast. That is a frame of motion, not a defect, so the scan waits for the
 * settled page. Endless animations (the skeleton shimmer) are not waited for; the skeleton itself is.
 */
export async function animationsSettled(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      !document.querySelector('.skel') &&
      document.getAnimations().every((a) => a.playState === 'finished' || a.effect?.getComputedTiming().endTime === Number.POSITIVE_INFINITY),
  );
}
