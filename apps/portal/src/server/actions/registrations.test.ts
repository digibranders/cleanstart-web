import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
const mail = vi.hoisted(() => ({ transport: null as import('@/server/email/fake').FakeEmailTransport | null }));
const crm = vi.hoisted(() => ({ hs: null as import('@/server/hubspot/types').HubspotApi | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));
vi.mock('@/server/email/send', () => ({
  sendEmail: (message: import('@/server/email/transport').EmailMessage) => {
    if (!mail.transport) throw new Error('no transport in test');
    return mail.transport.send(message);
  },
}));
vi.mock('@/server/hubspot/lookup', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/hubspot/lookup')>()),
  hubspotForRequest: () => (crm.hs ? { hs: crm.hs, pipelineId: 'pipeline-1' } : null),
}));

import { auditLog, notifications, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { FakeHubspot } from '@/server/hubspot/fake';
import { lookupCustomerAction, registerDealsAction, resubmitRegistrationAction } from './registrations';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  crm.hs = null;
  session.viewer = null;
});

const form = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  customer: 'Vardhan Capital',
  website: 'vardhancapital.in',
  products: ['libraries', 'cleansight'],
  region: 'india',
  managerId: null,
  contact: { name: 'Rohan Mehta', role: null, email: 'rohan.mehta@vardhancapital.in', phone: null },
  expectedClose: '',
  notes: '',
  ...over,
});

describe('registerDealsAction', () => {
  it('creates the registrations, audits each, tells the manager in the app and by one email', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    const result = await registerDealsAction(form());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.submitted'));
    expect(audit).toHaveLength(2);
    expect(audit[0]).toMatchObject({ kind: 'deal_decisions', who: 'partner', subjectType: 'registration' });
    const notes = await db.select().from(notifications).where(eq(notifications.userId, manager.id));
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ kind: 'registration_submitted', link: '/admin/approvals' });
    const mails = mail.transport!.to(manager.email);
    expect(mails).toHaveLength(1);
    expect(mails[0]?.htmlContent).toContain('Vardhan Capital');
  });

  it('returns validation issues with field paths', async () => {
    await asStaff(db, 'partner_manager', 'india');
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    const result = await registerDealsAction(form({ customer: '', website: 'not a domain', contact: { name: 'X', role: null, email: 'bad', phone: null } }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation');
    expect(result.error.issues?.map((i) => i.path).sort()).toEqual(['contact.email', 'customer', 'website']);
  });

  it('is forbidden for the technical role and reports a duplicate as a conflict', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await registerDealsAction(form())).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect((await registerDealsAction(form({ products: ['libraries'] }))).ok).toBe(true);
    expect(await registerDealsAction(form({ products: ['libraries'] }))).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await db.select().from(registrations)).toHaveLength(1);
  });

  it('still registers when no manager exists and no fallback address is configured, and only the partner gets a receipt', async () => {
    const viewer = await asPartner(db, { role: 'partner_admin' });
    session.viewer = viewer;
    const result = await registerDealsAction(form({ products: ['images'] }));
    expect(result.ok).toBe(true);
    expect(mail.transport!.sent).toHaveLength(1);
    expect(mail.transport!.to(viewer.email)).toHaveLength(1);
  });
});

describe('resubmitRegistrationAction', () => {
  it('puts a rejected registration back in the queue and alerts the manager', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    session.viewer = viewer;
    const reg = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', managerId: manager.id });
    const result = await resubmitRegistrationAction({ id: reg.id, contact: { name: 'Priya Shetty', role: null, email: 'priya@example.com' }, note: 'Added the budget owner' });
    expect(result.ok).toBe(true);
    expect((await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]?.status).toBe('pending');
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.resubmitted')))).toHaveLength(1);
    expect(mail.transport!.to(manager.email)).toHaveLength(1);
  });

  it('refuses a colleague\'s deal for a sales user and another company\'s deal', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    const theirs = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', registeredBy: admin.id });
    const foreign = await makeRegistration(db, { status: 'rejected' });
    const payload = { contact: { name: 'X', role: null, email: 'x@example.com' }, note: null };
    expect(await resubmitRegistrationAction({ id: theirs.id, ...payload })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await resubmitRegistrationAction({ id: foreign.id, ...payload })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('lookupCustomerAction', () => {
  it('returns the company\'s own customers and HubSpot name and website only', async () => {
    const partner = await makePartner(db, {});
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in' });
    const hs = new FakeHubspot();
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital Holdings', domain: 'holdings.vardhancapital.in', properties: { owner: 'secret' } });
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital', domain: 'vardhancapital.in', properties: {} });
    crm.hs = hs;
    const result = await lookupCustomerAction({ q: 'vardhan' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.own.map((o) => o.name)).toEqual(['Vardhan Capital']);
    expect(result.data.crm).toEqual([{ name: 'Vardhan Capital Holdings', website: 'holdings.vardhancapital.in' }]);
  });

  it('gives a user of another company the same shape and none of the first company\'s data', async () => {
    const first = await makePartner(db, {});
    await makeRegistration(db, { partnerId: first.id, customerName: 'Vardhan Capital' });
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    crm.hs = new FakeHubspot();
    const result = await lookupCustomerAction({ q: 'vardhan' });
    expect(result).toEqual({ ok: true, data: { own: [], crm: [] } });
  });

  it('keeps working from the portal data when HubSpot is not configured', async () => {
    const partner = await makePartner(db, {});
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital' });
    const result = await lookupCustomerAction({ q: 'vardhan' });
    expect(result.ok && result.data.own).toHaveLength(1);
    expect(result.ok && result.data.crm).toEqual([]);
  });

  it('allows 10 lookups a minute per user and refuses the 11th', async () => {
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    for (let i = 0; i < 10; i += 1) expect((await lookupCustomerAction({ q: 'abc' })).ok).toBe(true);
    expect(await lookupCustomerAction({ q: 'abc' })).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });

  it('is not for the technical role', async () => {
    session.viewer = await asPartner(db, { role: 'technical' });
    expect(await lookupCustomerAction({ q: 'abc' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});
