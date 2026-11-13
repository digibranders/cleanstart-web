import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.HUBSPOT_PARTNER_PIPELINE_ID = 'pipe-1';
});
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
  hubspotForRequest: () => (crm.hs ? { hs: crm.hs, pipelineId: 'pipe-1' } : null),
}));

import { auditLog, hubspotOutbox, notifications, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { systemClock } from '@/lib/clock';
import { protectionEndFor } from '@/lib/deal-rules';
import { FakeEmailTransport } from '@/server/email/fake';
import { FakeHubspot } from '@/server/hubspot/fake';
import {
  acceptRegistrationAction,
  hubspotConflictHintsAction,
  rejectRegistrationAction,
  undoDecisionAction,
} from './decisions';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  crm.hs = null;
  session.viewer = null;
});

const setup = async () => {
  const farhan = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example', name: 'Karan Malhotra' });
  const reg = await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', registeredBy: sales.id, managerId: farhan.id, region: 'india' });
  return { farhan, partner, sales, reg };
};

describe('acceptRegistrationAction', () => {
  it('accepts, audits once, queues exactly one HubSpot create, notifies and emails the registrant', async () => {
    const { farhan, sales, reg } = await setup();
    session.viewer = farhan;
    const result = await acceptRegistrationAction({ id: reg.id });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({ status: 'accepted', protectionEnd: protectionEndFor(systemClock.today()) });
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.accepted'));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ kind: 'deal_decisions', who: 'staff', actorLabel: farhan.name, subjectId: reg.id, target: 'Vardhan Capital, CleanSight, from Kestrel Systems' });
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ op: 'registration.create', subjectId: reg.id, status: 'pending' });
    expect(outbox[0]?.idempotencyKey).toMatch(new RegExp(`^registration\\.create:${reg.id}:\\d{13}$`));
    const notes = await db.select().from(notifications).where(eq(notifications.userId, sales.id));
    expect(notes[0]).toMatchObject({ kind: 'registration_accepted', link: `/partner/deals/${reg.id}` });
    expect(mail.transport!.only('karan@kestrel.example').htmlContent).toContain('Vardhan Capital');
  });

  it('is a conflict the second time and leaves one outbox row', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    await acceptRegistrationAction({ id: reg.id });
    expect(await acceptRegistrationAction({ id: reg.id })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });

  it('is forbidden for a partner viewer and for staff sales outside their region', async () => {
    const { partner, reg } = await setup();
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await acceptRegistrationAction({ id: reg.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    session.viewer = await asStaff(db, 'sales', 'middle_east');
    expect(await acceptRegistrationAction({ id: reg.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect((await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]?.status).toBe('pending');
  });
});

describe('simultaneous decisions', () => {
  it('give exactly one success and one already_decided, and one outbox row', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    const results = await Promise.all([acceptRegistrationAction({ id: reg.id }), rejectRegistrationAction({ id: reg.id, reason: 'Duplicate.' })]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const failed = results.find((r) => !r.ok);
    expect(failed).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(failed && !failed.ok && failed.error.message).toContain('already decided');
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox.length).toBeLessThanOrEqual(1);
  });
});

describe('rejectRegistrationAction', () => {
  it('needs a reason, then rejects with the reason in the audit entry, the notification and the email', async () => {
    const { farhan, sales, reg } = await setup();
    session.viewer = farhan;
    expect(await rejectRegistrationAction({ id: reg.id, reason: '  ' })).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'reason' }] } });
    const result = await rejectRegistrationAction({ id: reg.id, reason: 'Add the budget owner.' });
    expect(result.ok).toBe(true);
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.rejected')))[0]).toMatchObject({ note: 'Reason sent to the partner: Add the budget owner.' });
    expect((await db.select().from(notifications).where(eq(notifications.userId, sales.id)))[0]).toMatchObject({ kind: 'registration_rejected', body: 'Add the budget owner.' });
    expect(mail.transport!.only('karan@kestrel.example').htmlContent).toContain('Add the budget owner.');
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });
});

describe('undoDecisionAction', () => {
  it('undoes a fresh decision and writes an audit entry', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    await acceptRegistrationAction({ id: reg.id });
    const result = await undoDecisionAction({ id: reg.id });
    expect(result).toMatchObject({ ok: true, data: { status: 'pending', protectionEnd: null } });
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.decision_undone'))).toHaveLength(1);
  });

  it('queues a second create under its own key when a decision is undone and taken again (HubSpot checklist line 7)', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    expect((await acceptRegistrationAction({ id: reg.id })).ok).toBe(true);
    expect((await undoDecisionAction({ id: reg.id })).ok).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect((await acceptRegistrationAction({ id: reg.id })).ok).toBe(true);
    const outbox = await db.select().from(hubspotOutbox).where(eq(hubspotOutbox.op, 'registration.create'));
    expect(outbox).toHaveLength(2);
    expect(new Set(outbox.map((row) => row.idempotencyKey)).size).toBe(2);
    expect((await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]?.status).toBe('accepted');
  });

  it('is refused after the window and once a deal exists, with a message the screen can show', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    await acceptRegistrationAction({ id: reg.id });
    await db.update(registrations).set({ decidedAt: new Date(Date.now() - 11 * 60_000) }).where(eq(registrations.id, reg.id));
    const late = await undoDecisionAction({ id: reg.id });
    expect(late).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(late.ok === false && late.error.message).toContain('10 minutes');
    await db.update(registrations).set({ decidedAt: new Date(), hubspotDealId: '77' }).where(eq(registrations.id, reg.id));
    const synced = await undoDecisionAction({ id: reg.id });
    expect(synced.ok === false && synced.error.message).toContain('HubSpot');
  });
});

describe('hubspotConflictHintsAction', () => {
  it('names another partner\'s open HubSpot deal for waiting registrations', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    const hs = new FakeHubspot();
    const customer = await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital', domain: null, properties: {} });
    const theirs = await hs.createDeal({ pipeline: 'pipe-1', dealstage: hs.stageIds.Discovery, partner_company_id: '2', partner_name: 'Arbor Cyber' });
    await hs.associateDealWithCompany(theirs.id, customer.id, 'customer');
    crm.hs = hs;
    expect(await hubspotConflictHintsAction({ ids: [reg.id] })).toEqual({
      ok: true,
      data: { [reg.id]: { registrationId: reg.id, holder: 'Arbor Cyber', openDeals: 1 } },
    });
  });

  it('returns no hints when HubSpot is not configured and is not for partners', async () => {
    const { farhan, partner, reg } = await setup();
    session.viewer = farhan;
    expect(await hubspotConflictHintsAction({ ids: [reg.id] })).toEqual({ ok: true, data: {} });
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await hubspotConflictHintsAction({ ids: [reg.id] })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});
