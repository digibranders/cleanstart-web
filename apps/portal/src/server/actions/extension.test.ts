import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
const mail = vi.hoisted(() => ({ transport: null as import('@/server/email/fake').FakeEmailTransport | null }));
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

import { auditLog, hubspotOutbox, notifications, registrations } from '@/db/schema';
import { asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { decideExtensionAction, requestExtensionAction } from './extension';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  session.viewer = null;
});

const setup = async () => {
  const gaurav = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const salesUser = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted',
    protectionEnd: '2027-01-12', registeredBy: salesUser.id, managerId: gaurav.id, region: 'india',
  });
  return { gaurav, partner, salesUser, reg };
};

describe('requestExtensionAction', () => {
  it('records the request, audits it and tells the deal manager in the app and by email', async () => {
    const { gaurav, salesUser, reg } = await setup();
    session.viewer = await viewerFor(db, salesUser);
    const result = await requestExtensionAction({ id: reg.id, reason: 'Procurement is slow' });
    expect(result).toMatchObject({ ok: true, data: { extensionStatus: 'requested' } });
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.extension_requested')))[0]).toMatchObject({ note: 'Procurement is slow', kind: 'deal_decisions' });
    expect((await db.select().from(notifications).where(eq(notifications.userId, gaurav.id)))[0]).toMatchObject({ kind: 'extension_requested', link: `/admin/approvals/${reg.id}` });
    expect(mail.transport!.to(gaurav.email)).toHaveLength(1);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('refuses a second request, an empty reason, the technical role and a colleague\'s deal', async () => {
    const { partner, salesUser, reg } = await setup();
    session.viewer = await viewerFor(db, salesUser);
    await requestExtensionAction({ id: reg.id, reason: 'first' });
    expect(await requestExtensionAction({ id: reg.id, reason: 'second' })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await requestExtensionAction({ id: reg.id, reason: '  ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    const technical = await makeUser(db, { partnerId: partner.id, role: 'technical' });
    session.viewer = await viewerFor(db, technical);
    expect(await requestExtensionAction({ id: reg.id, reason: 'x' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    const colleague = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    session.viewer = await viewerFor(db, colleague);
    expect(await requestExtensionAction({ id: reg.id, reason: 'x' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('decideExtensionAction', () => {
  const asked = async () => {
    const ctx = await setup();
    await db.update(registrations).set({ extensionStatus: 'requested', extensionReason: 'Procurement is slow' }).where(eq(registrations.id, ctx.reg.id));
    return ctx;
  };

  it('grants: moves the end date, queues one update_end with the new date as its version, tells the registrant', async () => {
    const { gaurav, salesUser, reg } = await asked();
    session.viewer = gaurav;
    const result = await decideExtensionAction({ id: reg.id, decision: 'grant', note: 'Happy to help' });
    expect(result).toMatchObject({ ok: true, data: { protectionEnd: '2027-02-11', extensionStatus: 'granted' } });
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ op: 'registration.update_end', subjectId: reg.id, idempotencyKey: `registration.update_end:${reg.id}:2027-02-11` });
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.extension_granted')))[0]).toMatchObject({ note: 'Protected until 11 Feb 2027. Happy to help' });
    expect((await db.select().from(notifications).where(eq(notifications.userId, salesUser.id)))[0]).toMatchObject({ kind: 'extension_decided', link: `/partner/deals/${reg.id}` });
    expect(mail.transport!.only('karan@kestrel.example').htmlContent).toContain('Vardhan Capital');
  });

  it('declines without an outbox row, and refuses to decide twice', async () => {
    const { gaurav, reg } = await asked();
    session.viewer = gaurav;
    expect(await decideExtensionAction({ id: reg.id, decision: 'decline', note: null })).toMatchObject({ ok: true, data: { extensionStatus: 'declined', protectionEnd: '2027-01-12' } });
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.extension_declined')))).toHaveLength(1);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
    expect(await decideExtensionAction({ id: reg.id, decision: 'grant', note: null })).toMatchObject({ ok: false, error: { code: 'conflict' } });
  });

  it('is forbidden for partners and staff sales outside their region', async () => {
    const { salesUser, reg } = await asked();
    session.viewer = await viewerFor(db, salesUser);
    expect(await decideExtensionAction({ id: reg.id, decision: 'grant', note: null })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    session.viewer = await asStaff(db, 'sales', 'middle_east');
    expect(await decideExtensionAction({ id: reg.id, decision: 'grant', note: null })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});
