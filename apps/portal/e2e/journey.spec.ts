// Must be first: sets the database and the fakes before any src/ module reads the environment.
import './support/env';
import { type Browser, type BrowserContext, expect, type Page, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { invites } from '@/db/schema';
import { viewerFor } from '@/db/test-helpers';
import { systemClock } from '@/lib/clock';
import { withViewer } from '@/server/repo/context';
import { resendInvite } from '@/server/repo/invites';
import { db, outboxRowsFor, partnerByName, registrationByCustomer, userByEmail } from './support/db';
import { PERSONAS } from './support/env';
import { drainOutboxNow, hubspot, pollNow } from './support/hubspot';
import {
  acceptButton,
  acceptInvite,
  fillApplication,
  hydrated,
  openApplicationsTab,
  registerDeal,
  signInThroughTheForm,
} from './support/ui';

/**
 * The whole partner lifecycle in one serial run, each actor in their own browser context:
 * apply, approve, invite, accept, register a deal, accept the deal, then a stage change made in HubSpot (the
 * in-memory FakeHubspot) reaches the partner's deal page. One test per step so a failure names the step.
 * The steps depend on each other and on the rows global setup seeds; it writes its own partner, deal and audit rows
 * into the shared database, so its checks are scoped to COMPANY and CUSTOMER and never count rows.
 */
const COMPANY = 'Lattice Cloud Services E2E';
const APPLICANT = { name: 'Rohan Mehta', email: 'rohan@lattice-cloud-e2e.test' };
const CUSTOMER = 'Gulfway Freight E2E';

test.describe.configure({ mode: 'serial' });

test.describe('@portal partner lifecycle', () => {
  let applicant: BrowserContext;
  let staff: BrowserContext;
  let partner: BrowserContext;
  let staffPage: Page;
  let partnerPage: Page;
  let registrationId = '';

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    applicant = await browser.newContext();
    staff = await browser.newContext({ storageState: PERSONAS.manager.file });
    partner = await browser.newContext();
    staffPage = await staff.newPage();
    partnerPage = await partner.newPage();
  });

  test.afterAll(async () => {
    await Promise.all([applicant.close(), staff.close(), partner.close()]);
  });

  test('a company applies and sees its reference', async () => {
    const page = await applicant.newPage();
    await fillApplication(page, {
      company: COMPANY,
      website: 'lattice-cloud-e2e.test',
      name: APPLICANT.name,
      title: 'Director of Alliances',
      email: APPLICANT.email,
      phone: '+91 98765 43210',
    });
    await expect(page).toHaveURL(/\/apply\/done/);
    await expect(page.getByText(/APP-\d{4}-\d{4}/)).toBeVisible();
  });

  test('a partner manager approves the application and the invite goes out', async () => {
    await openApplicationsTab(staffPage);
    await staffPage.getByRole('button', { name: `Approve and invite ${COMPANY}` }).click();
    await expect(staffPage.getByText('Approved, invite sent')).toBeVisible();
    expect((await partnerByName(COMPANY)).status).toBe('onboarding');
  });

  test('the invited person accepts the invite and the agreement', async () => {
    // Only the hash of the invite token is stored and email is skipped in this run, so the test takes a fresh
    // token the way the Resend button does.
    const manager = await userByEmail(PERSONAS.manager.email);
    const viewer = await viewerFor(db(), manager);
    const [invite] = await db().select().from(invites).where(eq(invites.email, APPLICANT.email));
    if (!invite) throw new Error('the approval did not create an invite');
    const created = await withViewer(viewer, (tx) => resendInvite(tx, viewer, { inviteId: invite.id }, systemClock));

    const page = await partner.newPage();
    await page.goto(`/accept-invite?token=${encodeURIComponent(created.token)}`);
    await acceptInvite(page, APPLICANT.name);
    await page.waitForURL(/\/(partner\/welcome|sign-in)/);
    if (page.url().includes('/sign-in')) {
      await signInThroughTheForm(page, APPLICANT.email);
      await page.waitForURL(/\/partner\//);
    }
    await expect(page).toHaveURL(/\/partner\//);
    expect((await userByEmail(APPLICANT.email)).status).toBe('active');
    expect((await partnerByName(COMPANY)).agreementAcceptedAt).not.toBeNull();
    partnerPage = page;
  });

  test('the partner registers a deal and it waits for review', async () => {
    await registerDeal(partnerPage, {
      customer: CUSTOMER,
      contactName: 'Nadia Karim',
      contactEmail: 'nadia@gulfway-e2e.test',
      product: 'CleanSight',
    });
    await partnerPage.goto('/partner/deals');
    await expect(partnerPage.getByText(CUSTOMER).first()).toBeVisible();
    const row = await registrationByCustomer(CUSTOMER);
    expect(row.status).toBe('pending');
    registrationId = row.id;
  });

  test('staff accept the deal and protection starts', async () => {
    await staffPage.goto('/admin/approvals');
    await hydrated(staffPage);
    await acceptButton(staffPage, CUSTOMER, COMPANY).click();
    await expect.poll(async () => (await registrationByCustomer(CUSTOMER)).status).toBe('accepted');
    expect((await registrationByCustomer(CUSTOMER)).protectionEnd).not.toBeNull();
  });

  test('the approval reaches HubSpot, and a stage change made there shows on the partner deal page', async () => {
    await drainOutboxNow();
    const created = [...hubspot.deals.values()].filter((d) => d.properties.portal_registration_id === registrationId);
    expect(created).toHaveLength(1);
    const [deal] = created;
    if (!deal) throw new Error('no HubSpot deal');
    expect((await registrationByCustomer(CUSTOMER)).hubspotDealId).toBe(deal.id);

    await hubspot.updateDeal(deal.id, { dealstage: hubspot.stageIds['Technical evaluation'] });
    expect(await pollNow()).toMatchObject({ applied: 1 });
    expect((await registrationByCustomer(CUSTOMER)).stage).toBe('Technical evaluation');

    await partnerPage.goto(`/partner/deals/${registrationId}`);
    // The tracker lists every stage, so the text alone is always there; the current one carries aria-current.
    await expect(partnerPage.getByRole('list', { name: 'Deal stage' }).locator('[aria-current="step"]')).toHaveText('Technical evaluation');
  });

  test('the partner asks for an extension, staff grant it, the end date moves and HubSpot is told', async () => {
    const before = await registrationByCustomer(CUSTOMER);
    await partnerPage.goto(`/partner/deals/${registrationId}`);
    await hydrated(partnerPage);
    await partnerPage.getByRole('button', { name: 'Request extension' }).click();
    await partnerPage.getByLabel('Why do you need more time?').fill('The customer security review runs past the protection window.');
    await partnerPage.getByRole('button', { name: 'Send request' }).click();
    await expect(partnerPage.getByText('Extension requested, CleanStart will reply by email').first()).toBeVisible();
    expect((await registrationByCustomer(CUSTOMER)).extensionStatus).toBe('requested');

    await staffPage.goto('/admin/approvals');
    await hydrated(staffPage);
    await staffPage.getByRole('button', { name: /^Grant \d+ days$/ }).click();
    await expect.poll(async () => (await registrationByCustomer(CUSTOMER)).extensionStatus).toBe('granted');
    const after = await registrationByCustomer(CUSTOMER);
    expect(after.protectionEnd).not.toBe(before.protectionEnd);
    expect(new Date(after.protectionEnd ?? '').getTime()).toBeGreaterThan(new Date(before.protectionEnd ?? '').getTime());
    expect(await outboxRowsFor(registrationId, 'registration.update_end')).toBe(1);

    await drainOutboxNow();
    const dealId = after.hubspotDealId;
    if (!dealId) throw new Error('the registration has no HubSpot deal');
    expect(hubspot.deals.get(dealId)?.properties.protection_end_date).toBe(after.protectionEnd);
  });

  test('every step left an audit entry that the partner manager can read', async () => {
    // The seed already holds rows with the same actions, so each check is narrowed to this journey's own company or customer.
    const forTarget = async (query: string, action: string): Promise<void> => {
      await staffPage.goto(`/admin/audit?q=${encodeURIComponent(query)}`);
      await expect(staffPage.getByRole('button', { name: action }).first()).toBeVisible();
    };
    await forTarget(COMPANY, 'Approved an application');
    await forTarget(CUSTOMER, 'Accepted a registration');
    await forTarget(CUSTOMER, 'Stage changed');
  });
});

test.describe('@portal sign in', () => {
  test('a partner user cannot open the admin area', async ({ page }) => {
    await signInThroughTheForm(page, PERSONAS.arborAdmin.email);
    await page.waitForURL(/\/partner\//);
    await page.goto('/admin/audit');
    await expect(page).toHaveURL(/\/partner\//);
  });
});
