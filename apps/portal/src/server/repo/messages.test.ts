import { beforeEach, describe, expect, it } from 'vitest';
import { registrationMessages } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import { listMessages, postMessage } from './messages';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

const setup = async () => {
  const manager = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const adminUser = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
  const salesUser = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  const admin = await viewerFor(db, adminUser);
  const sales = await viewerFor(db, salesUser);
  const reg = await makeRegistration(db, { partnerId: partner.id, registeredBy: salesUser.id, managerId: manager.id, region: 'india' });
  return { manager, partner, admin, sales, adminUser, salesUser, reg };
};

describe('postMessage', () => {
  it('posts as a partner user, copies the author and company, and tells only the deal manager', async () => {
    const { manager, sales, reg, partner } = await setup();
    const out = await withViewer(sales, (tx) => postMessage(tx, sales, { registrationId: reg.id, body: '  Can we get a reference call?  ' }, clock));
    expect(out.message).toMatchObject({ side: 'partner', authorName: sales.name, authorOrg: 'Kestrel Systems', body: 'Can we get a reference call?', auto: false, createdAt: '2026-11-06T14:02:00.000Z' });
    expect(out.recipientUserIds).toEqual([manager.id]);
    expect(out.registration).toMatchObject({ id: reg.id, partnerId: partner.id, partnerName: 'Kestrel Systems', managerId: manager.id });
  });

  it('posts as staff and tells the registrant and the partner admins but not the author', async () => {
    const { manager, admin, sales, reg } = await setup();
    const out = await withViewer(manager, (tx) => postMessage(tx, manager, { registrationId: reg.id, body: 'Yes, two dates next week.' }, clock));
    expect(out.message).toMatchObject({ side: 'staff', authorOrg: 'CleanStart', authorId: manager.id });
    expect([...out.recipientUserIds].sort()).toEqual([admin.id, sales.id].sort());
  });

  it('rejects an empty message and a very long one', async () => {
    const { sales, reg } = await setup();
    await expect(withViewer(sales, (tx) => postMessage(tx, sales, { registrationId: reg.id, body: '   ' }, clock))).rejects.toBeInstanceOf(ValidationError);
    await expect(withViewer(sales, (tx) => postMessage(tx, sales, { registrationId: reg.id, body: 'x'.repeat(4001) }, clock))).rejects.toBeInstanceOf(ValidationError);
  });

  it('is not found for a colleague\'s deal seen by sales, another company, and a region outside staff sales scope', async () => {
    const { partner, admin, reg } = await setup();
    const other = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    const foreign = await makeRegistration(db, {});
    const gulf = await makeRegistration(db, { partnerId: partner.id, region: 'middle_east' });
    const staffIndia = await asStaff(db, 'sales', 'india');
    await expect(withViewer(other, (tx) => postMessage(tx, other, { registrationId: reg.id, body: 'hi' }, clock))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(admin, (tx) => postMessage(tx, admin, { registrationId: foreign.id, body: 'hi' }, clock))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(staffIndia, (tx) => postMessage(tx, staffIndia, { registrationId: gulf.id, body: 'hi' }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('listMessages', () => {
  it('returns the thread oldest first and nothing for an invisible registration', async () => {
    const { admin, reg } = await setup();
    await db.insert(registrationMessages).values([
      { registrationId: reg.id, authorName: 'B', authorOrg: 'CleanStart', side: 'staff', body: 'second', createdAt: new Date('2026-11-02T10:00:00Z') },
      { registrationId: reg.id, authorName: 'A', authorOrg: 'Kestrel', side: 'partner', body: 'first', createdAt: new Date('2026-11-01T10:00:00Z') },
    ]);
    const thread = await withViewer(admin, (tx) => listMessages(tx, admin, { registrationId: reg.id }));
    expect(thread.map((m) => m.body)).toEqual(['first', 'second']);
    const foreign = await makeRegistration(db, {});
    await expect(withViewer(admin, (tx) => listMessages(tx, admin, { registrationId: foreign.id }))).rejects.toBeInstanceOf(NotFoundError);
  });
});
