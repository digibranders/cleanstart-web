import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));

import { auditLog, notifications, registrationEvents, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { reassignRegistrationAction } from './registration-reassign';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  session.viewer = null;
});

const rowOf = async (id: string) => (await db.select().from(registrations).where(eq(registrations.id, id)))[0];

async function setup(status: 'pending' | 'accepted' = 'pending') {
  const india = await asStaff(db, 'partner_manager', 'india');
  const gulf = await asStaff(db, 'partner_manager', 'middle_east');
  const partner = await makePartner(db, {});
  const reg = await makeRegistration(db, { partnerId: partner.id, status, managerId: india.id, region: 'india' });
  return { india, gulf, partner, reg };
}

describe('reassignRegistrationAction', () => {
  it('moves a pending registration, audits before and after, notifies the new manager and writes a history line', async () => {
    const { india, gulf, reg } = await setup();
    session.viewer = india;
    const result = await reassignRegistrationAction({ id: reg.id, managerId: gulf.id, region: 'middle_east' });
    expect(result.ok).toBe(true);
    expect(await rowOf(reg.id)).toMatchObject({ managerId: gulf.id, region: 'middle_east', status: 'pending' });
    const [entry] = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.reassigned'));
    expect(entry).toMatchObject({ before: `${india.name}, India`, after: `${gulf.name}, Middle East`, subjectId: reg.id, partnerId: reg.partnerId });
    const [note] = await db.select().from(notifications).where(eq(notifications.userId, gulf.id));
    expect(note).toMatchObject({ link: `/admin/approvals/${reg.id}` });
    expect(note?.title).toContain('assigned to you');
    const events = await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, reg.id));
    expect(events.some((e) => e.text === `Reassigned from ${india.name}, India to ${gulf.name}, Middle East` && e.byLabel === india.name)).toBe(true);
  });

  it('writes nothing when the manager and the region are the same', async () => {
    const { india, reg } = await setup();
    session.viewer = india;
    expect((await reassignRegistrationAction({ id: reg.id, managerId: india.id, region: 'india' })).ok).toBe(true);
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.reassigned'))).toHaveLength(0);
  });

  it('changes only the region and does not notify when the manager stays', async () => {
    const { india, reg } = await setup();
    session.viewer = india;
    expect((await reassignRegistrationAction({ id: reg.id, managerId: india.id, region: 'middle_east' })).ok).toBe(true);
    expect((await rowOf(reg.id))?.region).toBe('middle_east');
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.reassigned'))).toHaveLength(1);
    expect(await db.select().from(notifications)).toHaveLength(0);
  });

  it('refuses a registration that is already decided and changes nothing', async () => {
    const { india, gulf, reg } = await setup('accepted');
    session.viewer = india;
    expect(await reassignRegistrationAction({ id: reg.id, managerId: gulf.id, region: 'middle_east' })).toMatchObject({
      ok: false,
      error: { code: 'conflict' },
    });
    expect(await rowOf(reg.id)).toMatchObject({ managerId: india.id, region: 'india' });
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.reassigned'))).toHaveLength(0);
  });

  it('refuses a manager who is not a partner manager', async () => {
    const { india, reg } = await setup();
    const sales = await asStaff(db, 'sales', 'india');
    session.viewer = india;
    expect(await reassignRegistrationAction({ id: reg.id, managerId: sales.id, region: 'india' })).toMatchObject({
      ok: false,
      error: { code: 'validation' },
    });
  });

  it('is for partner managers only: staff sales and partners are forbidden or see nothing', async () => {
    const { gulf, partner, reg } = await setup();
    session.viewer = await asStaff(db, 'sales', 'india');
    expect(await reassignRegistrationAction({ id: reg.id, managerId: gulf.id, region: 'middle_east' })).toMatchObject({
      ok: false,
      error: { code: 'forbidden' },
    });
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect((await reassignRegistrationAction({ id: reg.id, managerId: gulf.id, region: 'middle_east' })).ok).toBe(false);
    expect((await rowOf(reg.id))?.managerId).not.toBe(gulf.id);
  });
});
