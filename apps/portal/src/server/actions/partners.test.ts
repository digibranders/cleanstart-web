import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, hubspotOutbox, invites, partnerChecklist, partners } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-portal-client-ip': harness.ip }),
  cookies: async () => ({
    set: (name: string, value: string) => void harness.cookieJar.set(name, value),
    get: (name: string) => (harness.cookieJar.has(name) ? { value: harness.cookieJar.get(name) } : undefined),
  }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/sessions', () => ({ revokeAllSessions: vi.fn(async () => undefined) }));
vi.mock('@/server/auth/viewer', async () => {
  const { UnauthenticatedError } = await import('@/server/errors');
  return {
    requireActionViewer: async () => {
      if (!harness.viewer) throw new UnauthenticatedError();
      return harness.viewer;
    },
  };
});
vi.mock('@/server/email/send', async () => {
  const { FakeEmailTransport } = await import('@/server/email/fake');
  const fake = new FakeEmailTransport();
  return { sendEmail: (message: EmailMessage) => fake.send(message), fake };
});

import { revokeAllSessions } from '@/server/auth/sessions';
import {
  createPartnerAction,
  resendPartnerInvitesAction,
  restorePartnerAction,
  sendManagerMessageAction,
  setPartnerCategoryAction,
  setPartnerManagerAction,
  suspendPartnerAction,
  tickChecklistStepAction,
  updateCompanyProfileAction,
} from './partners';

const db = testDb();
let fake: FakeEmailTransport;

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  vi.mocked(revokeAllSessions).mockClear();
  harness.viewer = null;
});

describe('tickChecklistStepAction', () => {
  it('lets a partner admin tick kickoff and playbook', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await tickChecklistStepAction({ step: 'kickoff' });
    expect(result).toMatchObject({ ok: true });
    expect(await db.select().from(partnerChecklist).where(eq(partnerChecklist.partnerId, partner.id))).toHaveLength(1);
  });

  it('refuses derived steps, other roles and signed out callers', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await tickChecklistStepAction({ step: 'deal' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await tickChecklistStepAction({ step: 'kickoff' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = null;
    expect(await tickChecklistStepAction({ step: 'kickoff' })).toMatchObject({ ok: false, error: { code: 'unauthenticated' } });
  });
});

describe('sendManagerMessageAction', () => {
  it('emails the partner manager with the sender as reply-to', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser', email: 'omar@cleanstart.com' });
    const partner = await makePartner(db, { name: 'Qamar Solutions', managerId: manager.id });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    const result = await sendManagerMessageAction({ subject: 'Kickoff call', body: 'Can we talk on Tuesday?' });
    expect(result).toEqual({ ok: true, data: { managerName: 'Omar Nasser' } });
    const mail = fake.only('omar@cleanstart.com');
    expect(mail.replyTo?.email).toBe(harness.viewer.email);
    expect(mail.subject).toContain('Kickoff call');
    expect(mail.htmlContent).toContain('Can we talk on Tuesday?');
  });

  it('needs a subject, a body and an assigned manager', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await sendManagerMessageAction({ subject: '  ', body: 'x' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await sendManagerMessageAction({ subject: 'Hi', body: '' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: '', message: 'Your partner manager has not been assigned yet.' }] } });
    expect(fake.sent).toHaveLength(0);
  });

  it('reports a failed send instead of pretending it worked, and is not for staff', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', email: 'm@cleanstart.com' });
    const partner = await makePartner(db, { managerId: manager.id });
    harness.viewer = await asPartner(db, { partnerId: partner.id });
    fake.failNext = 'Brevo down';
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'integration' } });
    harness.viewer = await asStaff(db, 'partner_manager', 'india');
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});

describe('updateCompanyProfileAction', () => {
  const fields = { website: 'kestrelsystems.in', phone: '+91 80 4718 2290', address: '4th floor, Prestige Tech Park', about: 'Security reseller.' };

  it('lets a partner admin save, audits what changed and queues a partner.upsert keyed by the row time', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await updateCompanyProfileAction(fields);
    expect(result).toMatchObject({ ok: true, data: { website: 'kestrelsystems.in', about: 'Security reseller.' } });
    const [entry] = await db.select().from(auditLog);
    expect(entry).toMatchObject({ event: 'partner.profile_updated', note: 'Updated website, phone, address and what you sell' });
    const [row] = await db.select().from(partners).where(eq(partners.id, partner.id));
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.idempotencyKey).toBe(`partner.upsert:${partner.id}:${row?.updatedAt.getTime()}`);
  });

  it('does nothing when nothing changed: no audit entry, no outbox row', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await updateCompanyProfileAction(fields);
    const queued = (await db.select().from(hubspotOutbox)).length;
    const again = await updateCompanyProfileAction(fields);
    expect(again.ok).toBe(true);
    expect(await db.select().from(auditLog)).toHaveLength(1);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(queued);
  });

  it('is forbidden for partner sales and technical users and for another company', async () => {
    const partner = await makePartner(db, {});
    const other = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await updateCompanyProfileAction(fields)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await updateCompanyProfileAction(fields)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await updateCompanyProfileAction({ ...fields, partnerId: other.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });

  it('lets a partner manager edit any company by id', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asStaff(db, 'partner_manager', 'india');
    expect(await updateCompanyProfileAction({ ...fields, partnerId: partner.id })).toMatchObject({ ok: true, data: { partnerId: partner.id } });
  });

  it('limits field lengths', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await updateCompanyProfileAction({ ...fields, about: 'x'.repeat(1001) })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});

describe('partner management actions', () => {
  const manager = () => asStaff(db, 'partner_manager', 'india');
  const newPartner = { name: 'Dunes Networks', website: 'dunesnetworks.ae', category: 'channel', region: 'middle_east', adminName: 'Faisal Rahman', adminEmail: 'faisal@dunesnetworks.ae', sendInvite: true };

  it('adds a partner: audit, partner.upsert version 1, and an invite email addressed to the admin', async () => {
    harness.viewer = await manager();
    const result = await createPartnerAction(newPartner);
    expect(result).toMatchObject({ ok: true, data: { name: 'Dunes Networks', status: 'onboarding', users: 1 } });
    expect(JSON.stringify(result)).not.toContain('token');
    const created = result.ok ? result.data : null;
    expect((await db.select().from(auditLog)).map((a) => a.event)).toEqual(['partner.created']);
    expect((await db.select().from(hubspotOutbox))[0]).toMatchObject({ op: 'partner.upsert', subjectId: created?.id, idempotencyKey: `partner.upsert:${created?.id}:1` });
    const mail = fake.only('faisal@dunesnetworks.ae');
    expect(mail.htmlContent).toMatch(/accept-invite\?token=/u);
  });

  it('adds a partner without sending the invite', async () => {
    harness.viewer = await manager();
    expect(await createPartnerAction({ ...newPartner, sendInvite: false })).toMatchObject({ ok: true });
    expect(fake.sent).toHaveLength(0);
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('is for partner managers only and reports a domain conflict', async () => {
    harness.viewer = await asStaff(db, 'sales', 'india');
    expect(await createPartnerAction(newPartner)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asPartner(db, { role: 'partner_admin' });
    expect(await createPartnerAction(newPartner)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await manager();
    await makePartner(db, { domain: 'dunesnetworks.ae' });
    expect(await createPartnerAction(newPartner)).toMatchObject({ ok: false, error: { code: 'conflict', message: 'Another partner already uses this domain.' } });
  });

  it('changes manager and category with audit notes and a fresh outbox key each time', async () => {
    harness.viewer = await manager();
    const gaurav = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Gaurav Jadhav' });
    const omar = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const partner = await makePartner(db, { name: 'Arbor Cyber', managerId: gaurav.id, category: 'integrator' });
    expect(await setPartnerManagerAction({ id: partner.id, managerId: omar.id })).toMatchObject({ ok: true, data: { managerName: 'Omar Nasser' } });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await setPartnerCategoryAction({ id: partner.id, category: 'distributor' })).toMatchObject({ ok: true, data: { category: 'distributor' } });
    expect((await db.select().from(auditLog)).map((a) => [a.event, a.note]).sort()).toEqual([
      ['partner.category_changed', 'System integrator to Distributor'],
      ['partner.manager_changed', 'Gaurav Jadhav to Omar Nasser'],
    ]);
    const keys = (await db.select().from(hubspotOutbox)).map((o) => o.idempotencyKey);
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
  });

  it('does not audit or queue anything when nothing changes', async () => {
    harness.viewer = await manager();
    const gaurav = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const partner = await makePartner(db, { managerId: gaurav.id, category: 'channel' });
    await setPartnerManagerAction({ id: partner.id, managerId: gaurav.id });
    await setPartnerCategoryAction({ id: partner.id, category: 'channel' });
    expect(await db.select().from(auditLog)).toHaveLength(0);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('suspends: audit, outbox, and every person of the partner is signed out; restore audits too', async () => {
    harness.viewer = await manager();
    const partner = await makePartner(db, { name: 'Ironleaf', status: 'active' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    expect(await suspendPartnerAction({ id: partner.id })).toMatchObject({ ok: true, data: { status: 'suspended' } });
    expect(vi.mocked(revokeAllSessions).mock.calls.map((c) => c[0]).sort()).toEqual([admin.id, sales.id].sort());
    await suspendPartnerAction({ id: partner.id });
    expect(await restorePartnerAction({ id: partner.id })).toMatchObject({ ok: true, data: { status: 'active' } });
    expect((await db.select().from(auditLog)).map((a) => a.event).sort()).toEqual(['partner.restored', 'partner.suspended']);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(2);
  });

  it('resends every open invite, emails each, audits once, and says when nobody is left', async () => {
    harness.viewer = await manager();
    const partner = await makePartner(db, { name: 'Qamar Solutions' });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'yasmin.haddad@qamarsolutions.ae', expiresAt: new Date('2099-01-01T00:00:00Z') });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'zaid.omar@qamarsolutions.ae', expiresAt: new Date('2099-01-01T00:00:00Z') });
    expect(await resendPartnerInvitesAction({ id: partner.id })).toEqual({ ok: true, data: { count: 2 } });
    expect(fake.to('yasmin.haddad@qamarsolutions.ae')).toHaveLength(1);
    expect(fake.to('zaid.omar@qamarsolutions.ae')).toHaveLength(1);
    expect((await db.select().from(auditLog)).map((a) => [a.event, a.note])).toEqual([['team.invite_resent', '2 people']]);
    const empty = await makePartner(db, {});
    expect(await resendPartnerInvitesAction({ id: empty.id })).toEqual({ ok: true, data: { count: 0 } });
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });
});
