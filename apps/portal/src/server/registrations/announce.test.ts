import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notificationPrefs, notifications } from '@/db/schema';
import { makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { announceRegistrationChange } from './announce';

const db = testDb();
beforeEach(() => resetDb(db));

const setup = async () => {
  const partner = await makePartner(db, {});
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted', registeredBy: sales.id,
  });
  return { partner, sales, reg };
};

describe('announceRegistrationChange', () => {
  it('tells the person who registered the deal in the app and by email when a stage changes', async () => {
    const { sales, reg } = await setup();
    const transport = new FakeEmailTransport();
    await announceRegistrationChange({ db, transport }, { registrationId: reg.id, kind: 'stage_changed', stage: 'Proposal sent' });
    const rows = await db.select().from(notifications).where(eq(notifications.userId, sales.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'registration_stage', title: 'Vardhan Capital moved to Proposal sent', link: `/partner/deals/${reg.id}` });
    const mail = transport.only('karan@kestrel.example');
    expect(mail.htmlContent).toContain('Proposal sent');
  });

  it('keeps the in-app notification but sends no email when the user switched the category off', async () => {
    const { sales, reg } = await setup();
    await db.insert(notificationPrefs).values({ userId: sales.id, category: 'stage', email: false });
    const transport = new FakeEmailTransport();
    await announceRegistrationChange({ db, transport }, { registrationId: reg.id, kind: 'stage_changed', stage: 'Discovery' });
    expect(await db.select().from(notifications).where(eq(notifications.userId, sales.id))).toHaveLength(1);
    expect(transport.sent).toHaveLength(0);
  });

  it('writes a changed protection end in the app only, and an expiry in the app and by email', async () => {
    const { sales, reg } = await setup();
    const transport = new FakeEmailTransport();
    await announceRegistrationChange({ db, transport }, { registrationId: reg.id, kind: 'protection_end_changed', protectionEnd: '2027-03-01' });
    expect(transport.sent).toHaveLength(0);
    await announceRegistrationChange({ db, transport }, { registrationId: reg.id, kind: 'expired' });
    const rows = await db.select().from(notifications).where(eq(notifications.userId, sales.id));
    expect(rows.map((r) => [r.kind, r.title]).sort()).toEqual([
      ['registration_expired', 'Vardhan Capital protection ended'],
      ['registration_stage', 'Vardhan Capital protection now ends 1 Mar 2027'],
    ]);
    expect(transport.to('karan@kestrel.example')).toHaveLength(1);
  });

  it('does nothing for an unknown registration', async () => {
    const transport = new FakeEmailTransport();
    await announceRegistrationChange({ db, transport }, { registrationId: '00000000-0000-0000-0000-000000000001', kind: 'expired' });
    expect(await db.select().from(notifications)).toHaveLength(0);
  });
});
