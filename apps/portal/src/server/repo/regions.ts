import { and, asc, count, eq, sql } from 'drizzle-orm';
import { partners, regions, staffScopes, users } from '@/db/schema';
import { ALL_REGIONS } from '@/lib/domain';
import { checkRegionName, type RegionAdminDto, type RegionDto } from '@/lib/regions';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

const toDto = (row: typeof regions.$inferSelect): RegionDto => ({ key: row.key, name: row.name, sortOrder: row.sortOrder, active: row.active });

const ordered = [asc(regions.sortOrder), asc(regions.name)] as const;

/** Every region, inactive ones included, in display order. Any signed in user (and the system, for the public apply form). */
export async function listRegions(tx: Tx, _viewer?: Viewer): Promise<RegionDto[]> {
  return (await tx.select().from(regions).orderBy(...ordered)).map(toDto);
}

/** The staff screen: each region with its partner count and the partner managers who cover it. */
export async function listRegionsAdmin(tx: Tx, viewer: Viewer): Promise<RegionAdminDto[]> {
  assertStaff(viewer);
  const rows = await listRegions(tx);
  const partnerCounts = await tx.select({ region: partners.region, n: count() }).from(partners).groupBy(partners.region);
  const scopes = await tx
    .select({ id: users.id, name: users.name, role: users.role, region: staffScopes.region })
    .from(staffScopes)
    .innerJoin(users, eq(users.id, staffScopes.userId))
    .where(and(eq(users.kind, 'staff'), eq(users.status, 'active')))
    .orderBy(asc(users.name));
  return rows.map((r) => ({
    ...r,
    partnerCount: partnerCounts.find((p) => p.region === r.key)?.n ?? 0,
    managers: scopes
      .filter((s) => s.role === 'partner_manager' && (s.region === r.key || s.region === ALL_REGIONS))
      .map((s) => ({ id: s.id, name: s.name, allRegions: s.region === ALL_REGIONS })),
    staffCount: scopes.filter((s) => s.region === r.key).length,
  }));
}

/**
 * Throws a field ValidationError unless `key` is a region a record may be given now: an active one, or `current` when the
 * record already holds it (an inactive region stays on the records that have it).
 */
export async function assertRegionAssignable(tx: Tx, key: string, current?: string | null, path = 'region'): Promise<void> {
  const [row] = await tx.select({ active: regions.active }).from(regions).where(eq(regions.key, key)).limit(1);
  if (!row) throw new ValidationError([{ path, message: 'Choose a region from the list.' }]);
  if (!row.active && key !== current) throw new ValidationError([{ path, message: 'That region is no longer offered. Choose another.' }]);
}

/** Same as assertRegionAssignable, and ALL_REGIONS is always allowed. For staff scopes and staff invites. */
export async function assertStaffScopeAssignable(tx: Tx, value: string, current?: string | null): Promise<void> {
  if (value === ALL_REGIONS) return;
  await assertRegionAssignable(tx, value, current);
}

const loadForUpdate = async (tx: Tx, key: string): Promise<typeof regions.$inferSelect> => {
  const [row] = await tx.select().from(regions).where(eq(regions.key, key)).limit(1).for('update');
  if (!row) throw new NotFoundError('region');
  return row;
};

/** Adds a region at the end of the list. The key is slugged from the name once and never changes. */
export async function addRegion(tx: Tx, viewer: Viewer, input: { name: string }): Promise<RegionDto> {
  assertStaff(viewer);
  const existing = await listRegions(tx);
  const checked = checkRegionName(input.name, existing);
  if (!checked.ok) throw new ValidationError([{ path: 'name', message: checked.message }]);
  const sortOrder = Math.max(0, ...existing.map((r) => r.sortOrder)) + 10;
  const [row] = await tx
    .insert(regions)
    .values({ key: checked.key, name: checked.name, sortOrder })
    .onConflictDoNothing({ target: regions.key })
    .returning();
  if (!row) throw new ValidationError([{ path: 'name', message: `There is already a region called ${checked.name}.` }]);
  return toDto(row);
}

/** Changes the display name only. Keys are immutable, so nothing that stores a key is touched. */
export async function renameRegion(tx: Tx, viewer: Viewer, input: { key: string; name: string }): Promise<{ before: RegionDto; after: RegionDto }> {
  assertStaff(viewer);
  const current = await loadForUpdate(tx, input.key);
  const checked = checkRegionName(input.name, await listRegions(tx), input.key);
  if (!checked.ok) throw new ValidationError([{ path: 'name', message: checked.message }]);
  const [row] = await tx.update(regions).set({ name: checked.name }).where(eq(regions.key, input.key)).returning();
  return { before: toDto(current), after: toDto(row ?? current) };
}

/** Moves a region one place up or down and renumbers the list (10, 20, 30, ...). A move past either end changes nothing. */
export async function moveRegion(tx: Tx, viewer: Viewer, input: { key: string; direction: 'up' | 'down' }): Promise<RegionDto[]> {
  assertStaff(viewer);
  await tx.execute(sql`select 1 from ${regions} for update`);
  const list = await listRegions(tx);
  const from = list.findIndex((r) => r.key === input.key);
  if (from < 0) throw new NotFoundError('region');
  const to = input.direction === 'up' ? from - 1 : from + 1;
  const moved = list[from];
  const swapped = list[to];
  if (!moved || !swapped) return list;
  list[from] = swapped;
  list[to] = moved;
  for (const [i, region] of list.entries()) {
    const sortOrder = (i + 1) * 10;
    if (region.sortOrder !== sortOrder) await tx.update(regions).set({ sortOrder }).where(eq(regions.key, region.key));
  }
  return listRegions(tx);
}

/**
 * Deactivates or reactivates a region. A deactivated region stays on every partner, deal and staff scope that holds it and
 * is only hidden from new choices. The last active region cannot be deactivated. There is no delete.
 */
export async function setRegionActive(tx: Tx, viewer: Viewer, input: { key: string; active: boolean }): Promise<RegionDto> {
  assertStaff(viewer);
  const current = await loadForUpdate(tx, input.key);
  if (current.active === input.active) return toDto(current);
  if (!input.active) {
    const others = (await listRegions(tx)).filter((r) => r.active && r.key !== input.key);
    if (others.length === 0) throw new ConflictError('last_region', 'Keep at least one active region.');
  }
  const [row] = await tx.update(regions).set({ active: input.active }).where(eq(regions.key, input.key)).returning();
  return toDto(row ?? current);
}

export const isolation = defineIsolation<'listRegions' | 'listRegionsAdmin' | 'assertRegionAssignable' | 'assertStaffScopeAssignable' | 'addRegion' | 'renameRegion' | 'moveRegion' | 'setRegionActive'>({
  listRegions: { scope: 'tenant', probe: (tx, viewer) => listRegions(tx, viewer), expect: 'unchanged' },
  listRegionsAdmin: { scope: 'staff-only', probe: (tx, viewer) => listRegionsAdmin(tx, viewer), expect: 'forbidden' },
  assertRegionAssignable: { scope: 'tenant', probe: (tx) => assertRegionAssignable(tx, 'india'), expect: 'unchanged' },
  assertStaffScopeAssignable: { scope: 'tenant', probe: (tx) => assertStaffScopeAssignable(tx, 'all'), expect: 'unchanged' },
  addRegion: { scope: 'staff-only', probe: (tx, viewer) => addRegion(tx, viewer, { name: 'Probe' }), expect: 'forbidden' },
  renameRegion: { scope: 'staff-only', probe: (tx, viewer) => renameRegion(tx, viewer, { key: 'india', name: 'Probe' }), expect: 'forbidden' },
  moveRegion: { scope: 'staff-only', probe: (tx, viewer) => moveRegion(tx, viewer, { key: 'india', direction: 'down' }), expect: 'forbidden' },
  setRegionActive: { scope: 'staff-only', probe: (tx, viewer) => setRegionActive(tx, viewer, { key: 'india', active: false }), expect: 'forbidden' },
});
