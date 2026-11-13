import type { Page } from '@playwright/test';
import { E2E } from './env';

/**
 * Every label and role name the specs click lives in this file. The names are the ones the screens carry in the
 * mock (commit 58747992, markup unchanged by the conversion). If a screen renames something, fix it here once.
 */
export async function signInThroughTheForm(page: Page, email: string, password: string = E2E.password): Promise<void> {
  await page.goto('/sign-in');
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
  await page.locator('#ap-company').fill(a.company);
  await page.locator('#ap-site').fill(a.website);
  await page.locator('#ap-name').fill(a.name);
  await page.locator('#ap-title').fill(a.title);
  await page.locator('#ap-email').fill(a.email);
  await page.locator('#ap-phone').fill(a.phone);
  await page.getByRole('button', { name: 'Channel partner', exact: true }).click();
  await page.getByRole('button', { name: 'India', exact: true }).click();
  await page.locator('#ap-how').fill('Found CleanStart through a customer evaluation.');
  // The always-pass widget needs a moment to issue its token; submitting earlier shows "Confirm you are not a robot".
  await page.waitForFunction(() => Boolean((document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value));
  await page.getByRole('button', { name: 'Submit application' }).click();
}

export async function openApplicationsTab(page: Page): Promise<void> {
  await page.goto('/admin/partners');
  await page.getByRole('button', { name: /Applications/ }).click();
}

export async function acceptInvite(page: Page, name: string, password: string = E2E.password): Promise<void> {
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
