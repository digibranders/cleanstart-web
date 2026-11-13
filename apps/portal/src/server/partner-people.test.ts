import { beforeEach, describe, expect, it } from 'vitest';
import { makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem } from '@/server/repo/context';
import { loadPartnerPeople } from './partner-people';

const db = testDb();
const future = new Date('2099-01-01T00:00:00Z');
const load = (partnerId: string) => withSystem(SYSTEM_ACTORS.portal, (tx) => loadPartnerPeople(tx, partnerId));

beforeEach(async () => {
  await resetDb(db);
});

describe('loadPartnerPeople', () => {
  it('lists active people first, then people who only have an open invite, and leaves out removed people', async () => {
    const partner = await makePartner(db, {});
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao', email: 'aditi.rao@k.example' });
    await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled', email: 'gone@k.example' });
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram.sethi@k.example', expiresAt: future });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'technical', email: 'revoked@k.example', expiresAt: future, revokedAt: new Date('2026-11-01T00:00:00Z') });
    const people = await load(partner.id);
    expect(people.map((p) => [p.name, p.status, p.role])).toEqual([
      ['Aditi Rao', 'active', 'partner_admin'],
      ['Vikram Sethi', 'invited', 'sales'],
    ]);
    expect(people[0]).toMatchObject({ id: admin.id, userId: admin.id, inviteId: null });
    expect(people[1]).toMatchObject({ id: invite.id, userId: null, inviteId: invite.id });
  });

  it('attaches the open invite to a user row that is still in status invited', async () => {
    const partner = await makePartner(db, {});
    const user = await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'invited', name: 'Zaid Omar', email: 'zaid@k.example' });
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'zaid@k.example', expiresAt: future });
    const people = await load(partner.id);
    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({ id: user.id, userId: user.id, inviteId: invite.id, status: 'invited' });
  });
});
