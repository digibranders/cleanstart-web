import { beforeEach, describe, expect, it } from 'vitest';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { type Tx, withSystem } from '@/server/repo/context';
import { assertActiveManager, insertOnboardingPartner, pickManagerId } from './partner-routing';

const db = testDb();
const run = <T>(fn: (tx: Tx) => Promise<T>) => withSystem(SYSTEM_ACTORS.portal, fn);

beforeEach(async () => {
  await resetDb(db);
});

describe('pickManagerId', () => {
  it('prefers the manager whose scope is the region, then a manager for all regions, then any active manager', async () => {
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const me = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', status: 'disabled' });
    expect(await run((tx) => pickManagerId(tx, 'india'))).toBe(india.id);
    expect(await run((tx) => pickManagerId(tx, 'middle_east'))).toBe(me.id);
    // 'elsewhere' has no exact scope: falls to the oldest active manager
    expect(await run((tx) => pickManagerId(tx, 'elsewhere'))).toBe(india.id);
  });

  it('uses a manager that covers all regions before the oldest one', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const all = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'all' });
    expect(await run((tx) => pickManagerId(tx, 'elsewhere'))).toBe(all.id);
  });

  it('is null when there is no active partner manager', async () => {
    await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    expect(await run((tx) => pickManagerId(tx, 'india'))).toBeNull();
  });
});

describe('assertActiveManager', () => {
  it('accepts an active partner manager and rejects anyone else', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const sales = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await expect(run((tx) => assertActiveManager(tx, manager.id))).resolves.toBeUndefined();
    await expect(run((tx) => assertActiveManager(tx, sales.id))).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('insertOnboardingPartner', () => {
  it('creates an onboarding partner and refuses a domain another partner owns', async () => {
    const created = await run((tx) => insertOnboardingPartner(tx, { name: 'Tidewater Infosec', domain: 'tidewaterinfosec.in', category: 'channel', region: 'india', managerId: null }));
    expect(created).toMatchObject({ status: 'onboarding', agreementAcceptedAt: null, domain: 'tidewaterinfosec.in' });
    await makePartner(db, { domain: 'kestrelsystems.in' });
    await expect(run((tx) => insertOnboardingPartner(tx, { name: 'Other', domain: 'kestrelsystems.in', category: 'channel', region: 'india', managerId: null }))).rejects.toMatchObject({ reason: 'domain_is_partner' });
  });
});
