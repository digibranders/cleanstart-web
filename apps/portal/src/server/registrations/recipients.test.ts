import { beforeEach, describe, expect, it } from 'vitest';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { decisionRecipients, threadRecipients } from './recipients';

const db = testDb();
beforeEach(() => resetDb(db));

const setup = async () => {
  const partner = await makePartner(db, {});
  const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  return { partner, admin, sales };
};

describe('decisionRecipients', () => {
  it('is the person who registered the deal', async () => {
    const { partner, sales } = await setup();
    const ids = await db.transaction((tx) => decisionRecipients(tx, { partnerId: partner.id, registeredById: sales.id }));
    expect(ids).toEqual([sales.id]);
  });

  it('falls back to the active partner admins when that person is gone or unknown', async () => {
    const { partner, admin, sales } = await setup();
    const gone = await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled' });
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin', status: 'disabled' });
    expect(await db.transaction((tx) => decisionRecipients(tx, { partnerId: partner.id, registeredById: gone.id }))).toEqual([admin.id]);
    expect(await db.transaction((tx) => decisionRecipients(tx, { partnerId: partner.id, registeredById: null }))).toEqual([admin.id]);
    expect(sales.id).not.toBe(admin.id);
  });
});

describe('threadRecipients', () => {
  it('is the registrant and the partner admins, once each', async () => {
    const { partner, admin, sales } = await setup();
    const both = await db.transaction((tx) => threadRecipients(tx, { partnerId: partner.id, registeredById: sales.id }));
    expect([...both].sort()).toEqual([admin.id, sales.id].sort());
    const adminRegistered = await db.transaction((tx) => threadRecipients(tx, { partnerId: partner.id, registeredById: admin.id }));
    expect(adminRegistered).toEqual([admin.id]);
  });
});
