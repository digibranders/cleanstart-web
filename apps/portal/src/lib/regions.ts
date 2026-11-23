import { z } from 'zod';
import { ALL_REGIONS, type StaffScope } from './domain';

/** A row of the regions table as the screens see it. */
export interface RegionDto {
  key: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

/** The staff regions screen row: a region plus who and what sits in it. */
export interface RegionAdminDto extends RegionDto {
  partnerCount: number;
  /** Active partner managers who cover this region (among others, maybe), plus those who cover every region. */
  managers: { id: string; name: string; allRegions: boolean }[];
  /** Staff (any role) who cover this region, those who cover every region excluded. Shown for context, blocks nothing. */
  staffCount: number;
}

export const REGION_NAME_MAX = 40;
export const REGION_KEY_PATTERN = /^[a-z][a-z0-9_]{1,31}$/;

/** "asia_pacific" becomes "Asia Pacific". Only used when a key is not in the list. */
const titleCaseKey = (key: string): string =>
  key
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * The launch names, used only when a caller has no list to pass. The HubSpot code is the one such caller (it was left alone
 * on purpose); everything else passes the regions table's list, so a renamed or new region shows correctly.
 */
const LAUNCH_NAMES: Readonly<Record<string, string>> = { india: 'India', middle_east: 'Middle East', eu: 'EU', us: 'US', elsewhere: 'Elsewhere' };

/** The display name for a key from the regions table's list; 'all' is "All regions"; a key not in the list becomes a title cased key (with no list at all, a launch name first). */
export const regionName = (key: string, regions?: readonly RegionDto[]): string =>
  key === ALL_REGIONS ? 'All regions' : (regions ? regions.find((r) => r.key === key)?.name : LAUNCH_NAMES[key]) ?? titleCaseKey(key);

/** "CleanStart India", or plain "CleanStart" for every region or an unknown one. */
export const regionTeamLabel = (key: string | null, regions?: readonly RegionDto[]): string =>
  key === null || key === ALL_REGIONS ? 'CleanStart' : `CleanStart ${regionName(key, regions)}`;

/* ---------------------------------------------------------------- staff scope: one or several regions */

/** Joins names the way a sentence does: "India", "India and EU", "India, EU and US". */
const joinNames = (names: readonly string[]): string =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** A staff scope from region keys: 'all' wins when present, else the distinct keys in the order given. */
export const normalizeScope = (keys: readonly string[]): StaffScope => (keys.includes(ALL_REGIONS) ? ALL_REGIONS : [...new Set(keys)]);

/** True when a person with this scope covers `key`. */
export const scopeCovers = (scope: StaffScope, key: string): boolean => scope === ALL_REGIONS || scope.includes(key);

/** True for the person who covers every region. */
export const isAllRegions = (scope: StaffScope): scope is typeof ALL_REGIONS => scope === ALL_REGIONS;

/** The keys as a list: [] for every region (callers test isAllRegions first). */
export const scopeKeys = (scope: StaffScope): readonly string[] => (scope === ALL_REGIONS ? [] : scope);

/** Two scopes cover the same regions. */
export const sameScope = (a: StaffScope, b: StaffScope): boolean =>
  a === ALL_REGIONS || b === ALL_REGIONS ? a === b : a.length === b.length && a.every((k) => b.includes(k));

/**
 * One click on a choice in the multi select: 'all' replaces everything, a key replaces 'all', and a key already chosen is removed
 * unless it is the last one (a person covers at least one region).
 */
export const toggleScopeKey = (scope: StaffScope, key: string): StaffScope => {
  if (key === ALL_REGIONS) return ALL_REGIONS;
  if (scope === ALL_REGIONS) return [key];
  if (!scope.includes(key)) return [...scope, key];
  return scope.length === 1 ? scope : scope.filter((k) => k !== key);
};

/** The value stored on an invite: 'all' or the keys joined by commas (keys never contain a comma). */
export const encodeScope = (scope: StaffScope): string => (scope === ALL_REGIONS ? ALL_REGIONS : scope.join(','));

/** Reads an invite's stored value back. Null and blank mean every region, as a staff row with no scope always did. */
export const decodeScope = (stored: string | null | undefined): StaffScope => {
  const keys = (stored ?? '').split(',').map((k) => k.trim()).filter(Boolean);
  return keys.length === 0 ? ALL_REGIONS : normalizeScope(keys);
};

/**
 * The scope a staff row resolves to. `primary` is staff_scopes.region ('all' or a fallback key), `keys` the staff_regions rows.
 * No row at all (an invited person not yet accepted) is every region; a limited person with no rows yet (before the backfill) is their one key.
 */
export const resolveScope = (primary: string | null | undefined, keys: readonly string[]): StaffScope => {
  if (primary === null || primary === undefined || primary === ALL_REGIONS) return ALL_REGIONS;
  return keys.length > 0 ? [...keys] : [primary];
};

/** "All regions", "India", "India and EU". */
export const scopeLabel = (scope: StaffScope, regions?: readonly RegionDto[]): string =>
  scope === ALL_REGIONS ? 'All regions' : joinNames(scope.map((k) => regionName(k, regions)));

/** "CleanStart", "CleanStart India", "CleanStart India and EU". */
export const scopeTeamLabel = (scope: StaffScope, regions?: readonly RegionDto[]): string =>
  scope === ALL_REGIONS || scope.length === 0 ? 'CleanStart' : `CleanStart ${joinNames(scope.map((k) => regionName(k, regions)))}`;

/** Regions to offer for a new record: the active ones, plus `current` when a record already holds an inactive one. */
export const offerableRegions = (regions: readonly RegionDto[], current?: string | null): RegionDto[] =>
  regions
    .filter((r) => r.active || r.key === current)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

/** A key for a new region from its name: lower case, words joined with underscores, accents dropped. Empty when no letters survive. */
export const slugRegionKey = (name: string): string =>
  name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[0-9_]+/, '')
    .slice(0, 32)
    .replace(/_+$/, '');

export type RegionNameCheck = { ok: true; name: string; key: string } | { ok: false; message: string };

/** Trims and checks a region name. `existing` catches a duplicate name or key; `exceptKey` skips the region being renamed. */
export const checkRegionName = (raw: string, existing: readonly RegionDto[] = [], exceptKey?: string): RegionNameCheck => {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name === '') return { ok: false, message: 'Enter a name for the region.' };
  if (name.length > REGION_NAME_MAX) return { ok: false, message: `Keep the name to ${REGION_NAME_MAX} characters.` };
  const key = slugRegionKey(name);
  if (!REGION_KEY_PATTERN.test(key) || key === ALL_REGIONS) return { ok: false, message: 'Start the name with a letter and use at least two characters.' };
  const clash = existing.find((r) => r.key !== exceptKey && (r.name.toLowerCase() === name.toLowerCase() || r.key === key));
  if (clash) return { ok: false, message: `There is already a region called ${clash.name}.` };
  return { ok: true, name, key };
};

/** Zod for a region key on an input. Whether the key exists and is offered is checked against the table by the repo (assertRegionAssignable). */
export const regionKeySchema = z.string().regex(REGION_KEY_PATTERN, 'Choose a region from the list.');
/** A staff scope input: a region key or 'all'. */
export const staffScopeSchema = z.string().regex(new RegExp(`^(${REGION_KEY_PATTERN.source.slice(1, -1)}|${ALL_REGIONS})$`), 'Choose a region from the list.');

/** A staff scope input from a multi select: at least one key or 'all', collapsed to a StaffScope. */
export const staffScopesSchema = z.array(staffScopeSchema).min(1, 'Choose at least one region.').max(50).transform((keys): StaffScope => normalizeScope(keys));
