import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, authTwoFactors, users } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-portal-client-ip': '198.51.100.1' }) }));
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
import { resetUserTwoStepAction } from './staff-user-security';

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

const withTwoStep = async (partnerId: string, name = 'Aditi Rao') => {
  const user = await makeUser(db, { partnerId, role: 'sales', name, email: 'aditi@kestrelsystems.in' });
  await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, user.id));
  await db.insert(authTwoFactors).values({ userId: user.id, secret: 'enc-secret', backupCodes: 'enc-codes' });
  return user;
};

describe('resetUserTwoStepAction', () => {
  it('removes the authenticator and backup codes, signs the user out, audits the reason and emails them', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    const user = await withTwoStep(partner.id);
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    const result = await resetUserTwoStepAction({ userId: user.id, reason: 'Lost phone and backup codes' });
    expect(result).toMatchObject({ ok: true, data: { userId: user.id } });
    expect((await db.select().from(users).where(eq(users.id, user.id)))[0]?.twoFactorEnabled).toBe(false);
    expect(await db.select().from(authTwoFactors).where(eq(authTwoFactors.userId, user.id))).toHaveLength(0);
    expect(revokeAllSessions).toHaveBeenCalledWith(user.id);
    const [entry] = await db.select().from(auditLog);
    expect(entry).toMatchObject({ event: 'user.two_step_reset', note: 'Lost phone and backup codes', partnerId: partner.id, subjectId: user.id });
    expect(entry?.target).toBe('Aditi Rao, at Kestrel Systems');
    const mail = fake.only('aditi@kestrelsystems.in');
    expect(mail.subject).toContain('Two-step sign-in was reset');
    expect(mail.htmlContent).toContain('Lost phone and backup codes');
  });

  it('requires a typed reason and changes nothing without one', async () => {
    const partner = await makePartner(db, {});
    const user = await withTwoStep(partner.id);
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    expect(await resetUserTwoStepAction({ userId: user.id, reason: '  ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect((await db.select().from(users).where(eq(users.id, user.id)))[0]?.twoFactorEnabled).toBe(true);
    expect(await db.select().from(authTwoFactors)).toHaveLength(1);
    expect(revokeAllSessions).not.toHaveBeenCalled();
    expect(fake.sent).toHaveLength(0);
  });

  it('is for partner managers only: staff sales and partner users are refused and nothing changes', async () => {
    const partner = await makePartner(db, {});
    const user = await withTwoStep(partner.id);
    for (const viewer of [await asStaff(db, 'sales', 'all'), await asStaff(db, 'marketing', 'all'), await asPartner(db, { partnerId: partner.id, role: 'partner_admin' })]) {
      harness.viewer = viewer;
      expect(await resetUserTwoStepAction({ userId: user.id, reason: 'Because' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    }
    expect((await db.select().from(users).where(eq(users.id, user.id)))[0]?.twoFactorEnabled).toBe(true);
    expect(await db.select().from(authTwoFactors)).toHaveLength(1);
    expect(await db.select().from(auditLog)).toHaveLength(0);
  });

  it('never resets a staff user, a removed user, or someone with two-step already off', async () => {
    const partner = await makePartner(db, {});
    const staffUser = await makeUser(db, { kind: 'staff', role: 'sales' });
    await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, staffUser.id));
    const removed = await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled' });
    const plain = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    expect(await resetUserTwoStepAction({ userId: staffUser.id, reason: 'x' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await resetUserTwoStepAction({ userId: removed.id, reason: 'x' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await resetUserTwoStepAction({ userId: plain.id, reason: 'x' })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect((await db.select().from(users).where(eq(users.id, staffUser.id)))[0]?.twoFactorEnabled).toBe(true);
    expect(await db.select().from(auditLog)).toHaveLength(0);
  });
});
