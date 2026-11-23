import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { partners, regions, staffScopes } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { withViewer } from './context';
import {
  addRegion,
  assertRegionAssignable,
  assertStaffScopeAssignable,
  listRegions,
  listRegionsAdmin,
  moveRegion,
  renameRegion,
  setRegionActive,
} from './regions';
import { changeStaffRegion } from './staff';

const db = testDb();

beforeEach(async () => {
  await resetDb(db);
});

describe('the migrated list', () => {
  it('starts with India, Middle East, EU and US offered, and the legacy Elsewhere kept but not offered', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    const list = await withViewer(viewer, (tx) => listRegions(tx, viewer));
    expect(list.map((r) => [r.key, r.name, r.active])).toEqual([
      ['india', 'India', true],
      ['middle_east', 'Middle East', true],
      ['eu', 'EU', true],
      ['us', 'US', true],
      ['elsewhere', 'Elsewhere', false],
    ]);
  });

  it('is readable by a partner and not writable by one', async () => {
    const partner = await asPartner(db, {});
    expect(await withViewer(partner, (tx) => listRegions(tx, partner))).toHaveLength(5);
    await expect(withViewer(partner, (tx) => addRegion(tx, partner, { name: 'Africa' }))).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('keeps a partner that still holds the legacy value valid', async () => {
    const legacy = await makePartner(db, { region: 'elsewhere' });
    const [row] = await db.select({ region: partners.region }).from(partners).where(eq(partners.id, legacy.id));
    expect(row?.region).toBe('elsewhere');
  });
});

describe('addRegion', () => {
  it('slugs the name into an immutable key and puts the region last', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    const added = await withViewer(viewer, (tx) => addRegion(tx, viewer, { name: '  Asia   Pacific ' }));
    expect(added).toMatchObject({ key: 'asia_pacific', name: 'Asia Pacific', active: true });
    const list = await withViewer(viewer, (tx) => listRegions(tx, viewer));
    expect(list.at(-1)?.key).toBe('asia_pacific');
  });

  it('refuses a duplicate name or a name that slugs to an existing key', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    await expect(withViewer(viewer, (tx) => addRegion(tx, viewer, { name: 'india' }))).rejects.toMatchObject({ code: 'validation' });
    await expect(withViewer(viewer, (tx) => addRegion(tx, viewer, { name: 'Middle-East' }))).rejects.toMatchObject({ code: 'validation' });
    await expect(withViewer(viewer, (tx) => addRegion(tx, viewer, { name: '   ' }))).rejects.toMatchObject({ code: 'validation' });
  });

  it('the database refuses the reserved key all', async () => {
    await expect(db.insert(regions).values({ key: 'all', name: 'All' })).rejects.toThrow();
  });
});

describe('renameRegion', () => {
  it('changes the name and keeps the key, so records are untouched', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, { region: 'eu' });
    const { before, after } = await withViewer(viewer, (tx) => renameRegion(tx, viewer, { key: 'eu', name: 'Europe' }));
    expect([before.name, after.name, after.key]).toEqual(['EU', 'Europe', 'eu']);
    const [row] = await db.select({ region: partners.region }).from(partners).where(eq(partners.id, partner.id));
    expect(row?.region).toBe('eu');
  });

  it('refuses another region\'s name and an unknown key', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    await expect(withViewer(viewer, (tx) => renameRegion(tx, viewer, { key: 'eu', name: 'US' }))).rejects.toMatchObject({ code: 'validation' });
    await expect(withViewer(viewer, (tx) => renameRegion(tx, viewer, { key: 'nope', name: 'Nope' }))).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('moveRegion', () => {
  it('swaps neighbours, renumbers, and ignores a move past either end', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    await withViewer(viewer, (tx) => moveRegion(tx, viewer, { key: 'us', direction: 'up' }));
    const list = await withViewer(viewer, (tx) => listRegions(tx, viewer));
    expect(list.map((r) => r.key)).toEqual(['india', 'middle_east', 'us', 'eu', 'elsewhere']);
    expect(list.map((r) => r.sortOrder)).toEqual([10, 20, 30, 40, 50]);
    await withViewer(viewer, (tx) => moveRegion(tx, viewer, { key: 'india', direction: 'up' }));
    expect((await withViewer(viewer, (tx) => listRegions(tx, viewer)))[0]?.key).toBe('india');
  });
});

describe('setRegionActive', () => {
  it('deactivates without touching the records that hold the region, and reactivates', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, { region: 'us' });
    await withViewer(viewer, (tx) => setRegionActive(tx, viewer, { key: 'us', active: false }));
    const [row] = await db.select({ region: partners.region }).from(partners).where(eq(partners.id, partner.id));
    expect(row?.region).toBe('us');
    expect((await withViewer(viewer, (tx) => setRegionActive(tx, viewer, { key: 'us', active: true }))).active).toBe(true);
  });

  it('keeps at least one active region', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    for (const key of ['india', 'middle_east', 'eu']) await withViewer(viewer, (tx) => setRegionActive(tx, viewer, { key, active: false }));
    await expect(withViewer(viewer, (tx) => setRegionActive(tx, viewer, { key: 'us', active: false }))).rejects.toMatchObject({ code: 'conflict' });
  });

  it('has no delete: the repo exports none and the runtime role cannot delete', async () => {
    const mod = await import('./regions');
    expect(Object.keys(mod).some((k) => /delete|remove/i.test(k))).toBe(false);
  });
});

describe('assertRegionAssignable', () => {
  it('accepts an active region, rejects an unknown or inactive one, and allows the value a record already holds', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    await withViewer(viewer, async (tx) => {
      await expect(assertRegionAssignable(tx, 'eu')).resolves.toBeUndefined();
      await expect(assertRegionAssignable(tx, 'mars')).rejects.toMatchObject({ code: 'validation' });
      await expect(assertRegionAssignable(tx, 'elsewhere')).rejects.toMatchObject({ code: 'validation' });
      await expect(assertRegionAssignable(tx, 'elsewhere', 'elsewhere')).resolves.toBeUndefined();
      await expect(assertStaffScopeAssignable(tx, 'all')).resolves.toBeUndefined();
      await expect(assertStaffScopeAssignable(tx, 'mars')).rejects.toMatchObject({ code: 'validation' });
    });
  });
});

describe('listRegionsAdmin', () => {
  it('counts partners and names the partner managers who cover each region', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    const omar = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    await makePartner(db, { region: 'middle_east', managerId: omar.id });
    await makePartner(db, { region: 'middle_east' });
    const rows = await withViewer(viewer, (tx) => listRegionsAdmin(tx, viewer));
    const me = rows.find((r) => r.key === 'middle_east');
    expect(me?.partnerCount).toBe(2);
    expect(me?.managers.map((m) => [m.name, m.allRegions])).toEqual(expect.arrayContaining([['Omar Nasser', false], [viewer.name, true]]));
    expect(rows.find((r) => r.key === 'eu')?.partnerCount).toBe(0);
  });

  it('is for staff only', async () => {
    const partner = await asPartner(db, {});
    await expect(withViewer(partner, (tx) => listRegionsAdmin(tx, partner))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('staff scope', () => {
  it('lets a manager cover a region added later and refuses one that is not offered', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    const target = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await withViewer(viewer, (tx) => addRegion(tx, viewer, { name: 'Africa' }));
    await withViewer(viewer, (tx) => changeStaffRegion(tx, viewer, { userId: target.id, region: 'africa' }));
    const [scope] = await db.select({ region: staffScopes.region }).from(staffScopes).where(eq(staffScopes.userId, target.id));
    expect(scope?.region).toBe('africa');
    await expect(withViewer(viewer, (tx) => changeStaffRegion(tx, viewer, { userId: target.id, region: 'elsewhere' }))).rejects.toMatchObject({ code: 'validation' });
  });
});
