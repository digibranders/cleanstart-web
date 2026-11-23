import { z } from 'zod';
import { ALL_REGIONS } from './domain';

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
  /** Active partner managers whose scope is this region, plus those who cover every region. */
  managers: { id: string; name: string; allRegions: boolean }[];
  /** Staff (any role) scoped to exactly this region. Shown for context, blocks nothing. */
  staffCount: number;
}

export const REGION_NAME_MAX = 40;
export const REGION_KEY_PATTERN = /^[a-z][a-z0-9_]{1,31}$/;

/** Names the four launch regions and the legacy one, for places that have no list to hand (emails, receipts). */
const KNOWN_NAMES: Readonly<Record<string, string>> = {
  india: 'India',
  middle_east: 'Middle East',
  eu: 'EU',
  us: 'US',
  elsewhere: 'Elsewhere',
  [ALL_REGIONS]: 'All regions',
};

/** "asia_pacific" becomes "Asia Pacific". Only used when a key is not in the list. */
const titleCaseKey = (key: string): string =>
  key
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/** The display name for a key: from the list when given, else the launch names, else a title cased key. */
export const regionName = (key: string, regions?: readonly RegionDto[]): string =>
  regions?.find((r) => r.key === key)?.name ?? KNOWN_NAMES[key] ?? titleCaseKey(key);

/** "CleanStart India", or plain "CleanStart" for every region or an unknown one. */
export const regionTeamLabel = (key: string | null, regions?: readonly RegionDto[]): string =>
  key === null || key === ALL_REGIONS ? 'CleanStart' : `CleanStart ${regionName(key, regions)}`;

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
