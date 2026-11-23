import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, invites, registrations, users } from '@/db/schema';
import { asPartner, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1' }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-portal-client-ip': harness.ip }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
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
vi.mock('@/server/auth/sessions', () => ({ revokeAllSessions: vi.fn(async () => undefined) }));

import { revokeAllSessions } from '@/server/auth/sessions';
import { resetRateLimits } from '@/server/rate-limit';
import { confirmEmailChangeAction, reactivateMemberAction, requestMemberEmailChangeAction, updateMemberDetailsAction } from './member-edit';
import { inviteMemberAction, removeMemberAction } from './team';

const db = testDb();
let fake: FakeEmailTransport;

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  resetRateLimits();
  fake.clear();
  vi.mocked(revokeAllSessions).mockClear();
});

const company = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
  const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
  harness.viewer = admin;
  return { partner, admin };
};
const events = async () => (await db.select().from(auditLog)).map((a) => a.event).sort();

describe('updateMemberDetailsAction', () => {
  it('saves the details and audits before and after', async () => {
    const { partner } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan M' });
    expect(await updateMemberDetailsAction({ userId: member.id, name: 'Karan Malhotra', title: 'Lead', phone: '' })).toMatchObject({ ok: true, data: { changed: true } });
    const [entry] = await db.select().from(auditLog);
    expect(entry).toMatchObject({ event: 'team.member_updated', before: 'Karan M, none, none', after: 'Karan Malhotra, Lead, none' });
    expect(await updateMemberDetailsAction({ userId: member.id, name: 'Karan Malhotra', title: 'Lead', phone: '' })).toMatchObject({ ok: true, data: { changed: false } });
    expect(await events()).toEqual(['team.member_updated']);
  });

  it('is forbidden for sales and cannot reach another company', async () => {
    const { partner } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    const stranger = await makeUser(db, { partnerId: (await makePartner(db, {})).id, role: 'sales' });
    expect(await updateMemberDetailsAction({ userId: stranger.id, name: 'X', title: '', phone: '' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await updateMemberDetailsAction({ userId: member.id, name: 'X', title: '', phone: '' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});

describe('email change through the actions', () => {
  it('mails the new address, changes nothing until confirmed, then notifies the old one and signs the person out', async () => {
    const { partner } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrelsystems.in', name: 'Karan Malhotra' });
    expect(await requestMemberEmailChangeAction({ userId: member.id, email: 'karan.m@kestrelsystems.in' })).toMatchObject({ ok: true });
    const link = /confirm-email\?token=([A-Za-z0-9_-]{43})/u.exec(fake.only('karan.m@kestrelsystems.in').htmlContent);
    expect(link).not.toBeNull();
    expect((await db.select().from(users).where(eq(users.id, member.id)))[0]?.email).toBe('karan@kestrelsystems.in');

    harness.viewer = null;
    const token = link?.[1] ?? '';
    expect(await confirmEmailChangeAction({ token })).toMatchObject({ ok: true, data: { newEmail: 'karan.m@kestrelsystems.in' } });
    expect((await db.select().from(users).where(eq(users.id, member.id)))[0]?.email).toBe('karan.m@kestrelsystems.in');
    expect(revokeAllSessions).toHaveBeenCalledWith(member.id);
    expect(fake.only('karan@kestrelsystems.in').subject).toContain('email was changed');
    expect(await events()).toEqual(['team.email_change_requested', 'user.email_changed']);

    expect(await confirmEmailChangeAction({ token })).toMatchObject({ ok: false, error: { code: 'conflict' } });
  });

  it('rejects a taken address without sending anything', async () => {
    const { partner } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'taken@kestrelsystems.in' });
    expect(await requestMemberEmailChangeAction({ userId: member.id, email: 'taken@kestrelsystems.in' })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(fake.sent).toHaveLength(0);
  });
});

describe('reactivateMemberAction', () => {
  it('sends a fresh invite and audits', async () => {
    const { partner } = await company();
    const gone = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Vikram Sethi', status: 'disabled', email: 'vikram@kestrelsystems.in' });
    expect(await reactivateMemberAction({ userId: gone.id })).toMatchObject({ ok: true });
    expect(fake.only('vikram@kestrelsystems.in').htmlContent).toMatch(/accept-invite\?token=/u);
    expect(await events()).toEqual(['team.reactivated']);
  });

  it('is forbidden for a sales user', async () => {
    const { partner } = await company();
    const gone = await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled' });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await reactivateMemberAction({ userId: gone.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});

describe('removing a person with a deal hand over', () => {
  it('moves the deals, audits it, and a bad pick leaves the person in place', async () => {
    const { partner } = await company();
    const leaving = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
    const heir = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Meera Pillai' });
    const tech = await makeUser(db, { partnerId: partner.id, role: 'technical' });
    const deal = await makeRegistration(db, { partnerId: partner.id, registeredBy: leaving.id });

    expect(await removeMemberAction({ userId: leaving.id, moveDealsTo: tech.id })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect((await db.select().from(users).where(eq(users.id, leaving.id)))[0]?.status).toBe('active');

    expect(await removeMemberAction({ userId: leaving.id, moveDealsTo: heir.id })).toMatchObject({ ok: true });
    expect((await db.select().from(registrations).where(eq(registrations.id, deal.id)))[0]?.registeredBy).toBe(heir.id);
    expect(await events()).toEqual(['team.deals_moved', 'team.removed']);
  });
});

describe('inviting with a name', () => {
  it('stores the name and uses it in the email and the audit entry', async () => {
    await company();
    expect(await inviteMemberAction({ email: 'm.pillai@kestrelsystems.in', name: 'Meera Pillai', role: 'sales' })).toMatchObject({ ok: true });
    expect((await db.select().from(invites))[0]?.name).toBe('Meera Pillai');
    expect(fake.only('m.pillai@kestrelsystems.in').htmlContent).toContain('Hello Meera Pillai,');
    expect((await db.select().from(auditLog))[0]?.target).toContain('Meera Pillai');
  });
});
