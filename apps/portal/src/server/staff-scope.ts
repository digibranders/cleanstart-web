import { asc, eq, inArray, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { regions, staffRegions, staffScopes } from '@/db/schema';
import { ALL_REGIONS, type StaffScope } from '@/lib/domain';
import { resolveScope } from '@/lib/regions';
import { ValidationError } from '@/server/errors';
import type { Queryable } from '@/server/repo/context';

/**
 * The scope of each staff user. A user with no staff_scopes row is absent from the map (callers decide; an invited person
 * who has not signed in yet is 'all', as it always was). Pass `userIds` to limit the read.
 */
export async function loadScopes(q: Queryable, userIds?: readonly string[]): Promise<Map<string, StaffScope>> {
  if (userIds && userIds.length === 0) return new Map();
  const scopeRows = await q
    .select({ userId: staffScopes.userId, region: staffScopes.region })
    .from(staffScopes)
    .where(userIds ? inArray(staffScopes.userId, [...userIds]) : undefined);
  const keyRows = await q
    .select({ userId: staffRegions.userId, key: staffRegions.regionKey })
    .from(staffRegions)
    .innerJoin(regions, eq(regions.key, staffRegions.regionKey))
    .where(userIds ? inArray(staffRegions.userId, [...userIds]) : undefined)
    .orderBy(asc(regions.sortOrder), asc(regions.name));
  const keysOf = new Map<string, string[]>();
  for (const row of keyRows) keysOf.set(row.userId, [...(keysOf.get(row.userId) ?? []), row.key]);
  return new Map(scopeRows.map((row) => [row.userId, resolveScope(row.region, keysOf.get(row.userId) ?? [])]));
}

/** One user's scope, or 'all' when they have no staff_scopes row. */
export async function loadScope(q: Queryable, userId: string): Promise<StaffScope> {
  return (await loadScopes(q, [userId])).get(userId) ?? ALL_REGIONS;
}

/**
 * Writes a person's scope: the staff_scopes row ('all', or the first covered key in list order as the fallback value) and
 * their staff_regions rows (none for 'all'). The caller has checked that every key is a known region.
 */
export async function setStaffScope(q: Queryable, userId: string, scope: StaffScope): Promise<void> {
  const keys =
    scope === ALL_REGIONS
      ? []
      : (await q.select({ key: regions.key }).from(regions).where(inArray(regions.key, [...scope])).orderBy(asc(regions.sortOrder), asc(regions.name))).map((r) => r.key);
  const primary = scope === ALL_REGIONS ? ALL_REGIONS : keys[0];
  if (primary === undefined) throw new ValidationError([{ path: 'regions', message: 'Choose a region from the list.' }]);
  await q
    .insert(staffScopes)
    .values({ userId, region: primary })
    .onConflictDoUpdate({ target: staffScopes.userId, set: { region: primary } });
  await q.delete(staffRegions).where(eq(staffRegions.userId, userId));
  if (keys.length > 0) await q.insert(staffRegions).values(keys.map((regionKey) => ({ userId, regionKey })));
}

/** A SQL condition limiting `column` to the regions of a scope: undefined for every region (no filter), else a match on the keys. An empty list matches nothing. */
export function scopeCondition(scope: StaffScope, column: AnyColumn): SQL | undefined {
  if (scope === ALL_REGIONS) return undefined;
  return scope.length === 0 ? sql`false` : inArray(column, [...scope]);
}
