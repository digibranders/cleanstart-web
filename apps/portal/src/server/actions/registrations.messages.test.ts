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

import { notificationPrefs, notifications } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { resetRateLimits } from '@/server/rate-limit';
import { postMessageAction } from './registrations';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  session.viewer = null;
  resetRateLimits();
});

const setup = async () => {
  const manager = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const salesUser = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example', name: 'Karan Malhotra' });
  const adminUser = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'aditi@kestrel.example', name: 'Aditi Rao' });
  const reg = await makeRegistration(db, { partnerId: partner.id, registeredBy: salesUser.id, managerId: manager.id, customerName: 'Vardhan Capital' });
  return { manager, partner, salesUser, adminUser, reg };
};

describe('postMessageAction', () => {
  it('allows 30 messages in 10 minutes per user and refuses the 31st', async () => {
    const { manager, reg } = await setup();
    session.viewer = manager;
    for (let i = 0; i < 30; i += 1) expect((await postMessageAction({ registrationId: reg.id, body: `Note ${i}` })).ok).toBe(true);
    expect(await postMessageAction({ registrationId: reg.id, body: 'One more' })).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });

  it('lets staff write to the partner: the registrant and the admin are told in the app, and by email when their switch allows', async () => {
    const { manager, salesUser, adminUser, reg } = await setup();
    await db.insert(notificationPrefs).values({ userId: adminUser.id, category: 'decision', email: false });
    session.viewer = manager;
    const result = await postMessageAction({ registrationId: reg.id, body: 'Two dates next week.' });
    expect(result.ok).toBe(true);
    const sales = await db.select().from(notifications).where(eq(notifications.userId, salesUser.id));
    expect(sales[0]).toMatchObject({ kind: 'registration_message', link: `/partner/deals/${reg.id}` });
    expect(await db.select().from(notifications).where(eq(notifications.userId, adminUser.id))).toHaveLength(1);
    expect(mail.transport!.to('karan@kestrel.example')).toHaveLength(1);
    expect(mail.transport!.to('aditi@kestrel.example')).toHaveLength(0);
  });

  it('lets a partner user write to the deal manager', async () => {
    const { manager, salesUser, reg } = await setup();
    session.viewer = await viewerFor(db, salesUser);
    const result = await postMessageAction({ registrationId: reg.id, body: 'Can we get a reference call?' });
    expect(result.ok).toBe(true);
    const rows = await db.select().from(notifications).where(eq(notifications.userId, manager.id));
    expect(rows[0]).toMatchObject({ kind: 'registration_message', link: `/admin/approvals/${reg.id}` });
    expect(mail.transport!.to(manager.email)).toHaveLength(1);
  });

  it('refuses the technical role, a colleague\'s deal for sales, an empty body and another company', async () => {
    const { partner, adminUser, reg } = await setup();
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await postMessageAction({ registrationId: reg.id, body: 'hi' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    const other = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    session.viewer = other;
    expect(await postMessageAction({ registrationId: reg.id, body: 'hi' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    session.viewer = await viewerFor(db, adminUser);
    expect(await postMessageAction({ registrationId: reg.id, body: '   ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    const foreign = await makeRegistration(db, {});
    expect(await postMessageAction({ registrationId: foreign.id, body: 'hi' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});
