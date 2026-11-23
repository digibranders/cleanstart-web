import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.HUBSPOT_PARTNER_PIPELINE_ID = 'pipe-1';
});
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

import { auditLog, notifications, registrationEvents, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { acceptRegistrationAction } from './decisions';
import { registerDealsAction } from './registrations';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  session.viewer = null;
});

const form = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  customer: 'Vardhan Capital',
  website: 'vardhancapital.in',
  products: ['libraries'],
  region: 'india',
  managerId: null,
  contact: { name: 'Rohan Mehta', role: null, email: 'rohan.mehta@vardhancapital.in', phone: null },
  expectedClose: '',
  notes: '',
  ...over,
});

describe('registering on behalf of a partner', () => {
  it('lets a partner manager register for any partner and audits who did it for whom', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    session.viewer = manager;
    const result = await registerDealsAction(form({ partnerId: partner.id, products: ['libraries', 'cleansight'] }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    const rows = await db.select().from(registrations);
    expect(rows.every((r) => r.partnerId === partner.id && r.registeredBy === manager.id && r.status === 'pending')).toBe(true);
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.submitted'));
    expect(audit).toHaveLength(2);
    expect(audit[0]).toMatchObject({ who: 'staff', actorId: manager.id, partnerId: partner.id });
    expect(audit[0]?.note).toBe(`Registered on behalf of Kestrel Systems by ${manager.name}. Sent for approval.`);
    const events = await db.select().from(registrationEvents);
    expect(events.every((e) => e.text === 'Registered by CleanStart on behalf of the partner' && e.byLabel === manager.name)).toBe(true);
    expect(admin.id).toBeTruthy();
  });

  it('sends the partner no receipt email, and a later decision goes to the partner admins, not to the staff member', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    session.viewer = manager;
    const result = await registerDealsAction(form({ partnerId: partner.id }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(mail.transport?.to(admin.email)).toHaveLength(0);
    const accepted = await acceptRegistrationAction({ id: result.data[0]?.id });
    expect(accepted.ok).toBe(true);
    expect(mail.transport?.to(admin.email)).toHaveLength(1);
    expect(await db.select().from(notifications).where(eq(notifications.userId, admin.id))).toHaveLength(1);
    expect((await db.select().from(notifications).where(eq(notifications.userId, manager.id))).every((n) => n.kind !== 'registration_accepted')).toBe(true);
  });

  it('needs the partner: without partnerId a staff submission is a validation error', async () => {
    session.viewer = await asStaff(db, 'partner_manager', 'india');
    expect(await registerDealsAction(form())).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await db.select().from(registrations)).toHaveLength(0);
  });

  it('is forbidden for staff sales and marketing', async () => {
    const partner = await makePartner(db, {});
    for (const role of ['sales', 'marketing'] as const) {
      session.viewer = await asStaff(db, role, 'all');
      expect(await registerDealsAction(form({ partnerId: partner.id }))).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    }
    expect(await db.select().from(registrations)).toHaveLength(0);
  });

  it('never lets a partner register for another partner', async () => {
    const mine = await makePartner(db, {});
    const theirs = await makePartner(db, {});
    session.viewer = await asPartner(db, { partnerId: mine.id, role: 'partner_admin' });
    expect(await registerDealsAction(form({ partnerId: theirs.id }))).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(await db.select().from(registrations)).toHaveLength(0);
  });
});
