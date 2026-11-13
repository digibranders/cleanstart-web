import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notificationPrefs, notifications, registrationReminders, registrations, users } from '@/db/schema';
import { makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeEmailTransport } from '@/server/email/fake';
import { expireRegistrations } from './expiry';
import { sendExpiryReminders } from './expiry-reminders';

const db = testDb();
const clock = fixedClock('2026-11-06T05:00:00Z');
beforeEach(() => resetDb(db));

const setup = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example' });
  const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'aditi@kestrel.example' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted', protectionEnd: '2026-11-20', registeredBy: sales.id,
  });
  return { partner, sales, admin, reg };
};

describe('sendExpiryReminders', () => {
  it('notifies once when two runs overlap', async () => {
    await setup();
    const transport = new FakeEmailTransport();
    await Promise.all([sendExpiryReminders({ clock, transport }), sendExpiryReminders({ clock, transport })]);
    expect(await db.select().from(notifications)).toHaveLength(2);
    expect(await db.select().from(registrationReminders)).toHaveLength(1);
    expect(transport.sent).toHaveLength(2);
  });

  it('notifies and emails the registrant and the admin 14 days before, once', async () => {
    const { sales, admin, reg } = await setup();
    const transport = new FakeEmailTransport();
    expect(await sendExpiryReminders({ clock, transport })).toEqual({ candidates: 1 });
    const rows = await db.select().from(notifications);
    expect(rows.map((r) => r.userId).sort()).toEqual([admin.id, sales.id].sort());
    expect(rows[0]).toMatchObject({ kind: 'registration_expiring', title: 'Vardhan Capital protection ends in 14 days', link: `/partner/deals/${reg.id}` });
    expect(transport.to('karan@kestrel.example')[0]?.htmlContent).toContain('Vardhan Capital');
    expect(transport.to('aditi@kestrel.example')).toHaveLength(1);
    expect(await db.select().from(registrationReminders)).toHaveLength(1);

    expect(await sendExpiryReminders({ clock, transport })).toEqual({ candidates: 0 });
    expect(await db.select().from(notifications)).toHaveLength(2);
    expect(transport.sent).toHaveLength(2);
  });

  it('sends the 3 day reminder separately, and a new date after an extension gets its own', async () => {
    const { reg } = await setup();
    const transport = new FakeEmailTransport();
    await sendExpiryReminders({ clock, transport });
    await sendExpiryReminders({ clock: fixedClock('2026-11-17T05:00:00Z'), transport });
    expect((await db.select().from(registrationReminders)).map((r) => r.daysBefore).sort()).toEqual([14, 3]);
    await db.update(registrations).set({ protectionEnd: '2026-12-20' }).where(eq(registrations.id, reg.id));
    expect(await sendExpiryReminders({ clock: fixedClock('2026-12-06T05:00:00Z'), transport })).toEqual({ candidates: 1 });
    expect(await db.select().from(registrationReminders)).toHaveLength(3);
  });

  it('keeps the in-app notification but no email when the user switched expiry emails off', async () => {
    const { sales, admin } = await setup();
    await db.insert(notificationPrefs).values([
      { userId: sales.id, category: 'expiry', email: false },
      { userId: admin.id, category: 'expiry', email: false },
    ]);
    const transport = new FakeEmailTransport();
    await sendExpiryReminders({ clock, transport });
    expect(await db.select().from(notifications)).toHaveLength(2);
    expect(transport.sent).toHaveLength(0);
  });

  it('falls back to the admins when the registrant has left, and still marks the reminder sent when nobody is left', async () => {
    const { partner, sales, admin } = await setup();
    await db.update(users).set({ status: 'disabled' }).where(eq(users.id, sales.id));
    const transport = new FakeEmailTransport();
    await sendExpiryReminders({ clock, transport });
    expect((await db.select().from(notifications)).map((n) => n.userId)).toEqual([admin.id]);
    await db.update(users).set({ status: 'disabled' }).where(eq(users.partnerId, partner.id));
    await db.delete(registrationReminders);
    const before = (await db.select().from(notifications)).length;
    expect(await sendExpiryReminders({ clock, transport })).toEqual({ candidates: 1 });
    expect(await db.select().from(registrationReminders)).toHaveLength(1);
    expect(await db.select().from(notifications)).toHaveLength(before);
  });

  it('does not stop at an email that fails', async () => {
    await setup();
    const transport = new FakeEmailTransport();
    transport.failNext = 'smtp down';
    expect(await sendExpiryReminders({ clock, transport })).toEqual({ candidates: 1 });
    expect(await db.select().from(registrationReminders)).toHaveLength(1);
  });
});

describe('with the nightly expiry job (H4.8, black box)', () => {
  it('lets the 3 day reminder go out before expiry, and sends nothing for a registration the job expired', async () => {
    const { partner } = await setup();
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Ends today', status: 'accepted', protectionEnd: '2026-11-06' });
    const lapsed = await makeRegistration(db, { partnerId: partner.id, customerName: 'Lapsed', status: 'accepted', protectionEnd: '2026-11-05' });
    const out = await expireRegistrations({ db, clock: fixedClock('2026-11-06T00:10:00Z') });
    expect(out.expired).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, lapsed.id)))[0]?.status).toBe('expired');
    const transport = new FakeEmailTransport();
    expect(await sendExpiryReminders({ clock: fixedClock('2026-11-03T05:00:00Z'), transport })).toEqual({ candidates: 1 });
    expect((await db.select().from(registrations).where(eq(registrations.customerName, 'Ends today')))[0]?.status).toBe('accepted');
  });
});
