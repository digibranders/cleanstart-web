import { describe, expect, it } from 'vitest';
import {
  checkRegionName,
  offerableRegions,
  type RegionDto,
  regionKeySchema,
  regionName,
  decodeScope,
  encodeScope,
  isAllRegions,
  normalizeScope,
  regionTeamLabel,
  resolveScope,
  sameScope,
  scopeCovers,
  scopeLabel,
  scopeTeamLabel,
  staffScopesSchema,
  toggleScopeKey,
  slugRegionKey,
  staffScopeSchema,
} from './regions';

const list: RegionDto[] = [
  { key: 'us', name: 'US', sortOrder: 40, active: true },
  { key: 'india', name: 'India', sortOrder: 10, active: true },
  { key: 'elsewhere', name: 'Elsewhere', sortOrder: 900, active: false },
];

describe('slugRegionKey', () => {
  it('lower cases, joins words with underscores and drops accents and punctuation', () => {
    expect(slugRegionKey('Middle East')).toBe('middle_east');
    expect(slugRegionKey('  Asia / Pacific  ')).toBe('asia_pacific');
    expect(slugRegionKey('Côte d’Ivoire')).toBe('cote_d_ivoire');
  });
  it('starts with a letter, caps the length and returns empty when no letters survive', () => {
    expect(slugRegionKey('1st zone')).toBe('st_zone');
    expect(slugRegionKey('a'.repeat(60))).toHaveLength(32);
    expect(slugRegionKey('!!!')).toBe('');
  });
});

describe('checkRegionName', () => {
  it('accepts a good name, trimmed, with its key', () => {
    expect(checkRegionName('  Latin   America ', list)).toEqual({ ok: true, name: 'Latin America', key: 'latin_america' });
  });
  it('rejects empty, too long, no letters, reserved and duplicate names', () => {
    expect(checkRegionName('  ').ok).toBe(false);
    expect(checkRegionName('x'.repeat(41)).ok).toBe(false);
    expect(checkRegionName('123').ok).toBe(false);
    expect(checkRegionName('All').ok).toBe(false);
    expect(checkRegionName('india', list).ok).toBe(false);
  });
  it('lets a region keep its own name when renaming', () => {
    expect(checkRegionName('India', list, 'india').ok).toBe(true);
  });
});

describe('names and offers', () => {
  it('names from the list, then the launch names, then a title cased key', () => {
    expect(regionName('us', [{ key: 'us', name: 'United States', sortOrder: 1, active: true }])).toBe('United States');
    expect(regionName('middle_east')).toBe('Middle East');
    expect(regionName('asia_pacific')).toBe('Asia Pacific');
  });
  it('shows a renamed or new region from the table, and a title cased key when the table lacks it', () => {
    const table: RegionDto[] = [
      { key: 'eu', name: 'European Union', sortOrder: 1, active: true },
      { key: 'africa', name: 'Africa', sortOrder: 2, active: true },
    ];
    expect(regionName('eu', table)).toBe('European Union');
    expect(regionName('africa', table)).toBe('Africa');
    expect(regionName('india', table)).toBe('India');
    expect(regionName('middle_east', table)).toBe('Middle East');
    expect(regionName('all', table)).toBe('All regions');
  });
  it('labels the team', () => {
    expect(regionTeamLabel('eu')).toBe('CleanStart EU');
    expect(regionTeamLabel('all')).toBe('CleanStart');
    expect(regionTeamLabel(null)).toBe('CleanStart');
  });
  it('offers active regions in order, plus the one a record already holds', () => {
    expect(offerableRegions(list).map((r) => r.key)).toEqual(['india', 'us']);
    expect(offerableRegions(list, 'elsewhere').map((r) => r.key)).toEqual(['india', 'us', 'elsewhere']);
  });
});

describe('input schemas', () => {
  it('accepts key shaped values and refuses everything else', () => {
    expect(regionKeySchema.safeParse('middle_east').success).toBe(true);
    expect(regionKeySchema.safeParse('Middle East').success).toBe(false);
    expect(staffScopeSchema.safeParse('all').success).toBe(true);
    expect(staffScopeSchema.safeParse('eu').success).toBe(true);
    expect(staffScopeSchema.safeParse('EU!').success).toBe(false);
  });
});

describe('staff scope', () => {
  it('collapses to all when all is chosen and removes duplicates otherwise', () => {
    expect(normalizeScope(['india', 'all'])).toBe('all');
    expect(normalizeScope(['eu', 'india', 'eu'])).toEqual(['eu', 'india']);
  });
  it('knows what a scope covers and compares scopes regardless of order', () => {
    expect(scopeCovers('all', 'eu')).toBe(true);
    expect(scopeCovers(['india'], 'eu')).toBe(false);
    expect(scopeCovers(['india', 'eu'], 'eu')).toBe(true);
    expect(isAllRegions('all')).toBe(true);
    expect(sameScope(['eu', 'india'], ['india', 'eu'])).toBe(true);
    expect(sameScope('all', ['india'])).toBe(false);
  });
  it('round trips the stored text and reads blank as every region', () => {
    expect(encodeScope(['middle_east', 'eu'])).toBe('middle_east,eu');
    expect(encodeScope('all')).toBe('all');
    expect(decodeScope('middle_east,eu')).toEqual(['middle_east', 'eu']);
    expect(decodeScope('india')).toEqual(['india']);
    expect(decodeScope('all')).toBe('all');
    expect(decodeScope(null)).toBe('all');
    expect(decodeScope('')).toBe('all');
  });
  it('resolves a stored row: all, the region rows, or the one fallback key before the backfill', () => {
    expect(resolveScope('all', ['india'])).toBe('all');
    expect(resolveScope(null, [])).toBe('all');
    expect(resolveScope('india', ['india', 'eu'])).toEqual(['india', 'eu']);
    expect(resolveScope('india', [])).toEqual(['india']);
  });
  it('labels a scope with names from the list', () => {
    const table: RegionDto[] = [
      { key: 'middle_east', name: 'Middle East', sortOrder: 1, active: true },
      { key: 'eu', name: 'EU', sortOrder: 2, active: true },
      { key: 'us', name: 'US', sortOrder: 3, active: true },
    ];
    expect(scopeLabel('all', table)).toBe('All regions');
    expect(scopeLabel(['eu'], table)).toBe('EU');
    expect(scopeLabel(['middle_east', 'eu'], table)).toBe('Middle East and EU');
    expect(scopeLabel(['middle_east', 'eu', 'us'], table)).toBe('Middle East, EU and US');
    expect(scopeTeamLabel(['middle_east', 'eu'], table)).toBe('CleanStart Middle East and EU');
    expect(scopeTeamLabel('all', table)).toBe('CleanStart');
  });
  it('toggles choices in the multi select', () => {
    expect(toggleScopeKey('all', 'india')).toEqual(['india']);
    expect(toggleScopeKey(['india'], 'eu')).toEqual(['india', 'eu']);
    expect(toggleScopeKey(['india', 'eu'], 'india')).toEqual(['eu']);
    expect(toggleScopeKey(['india'], 'india')).toEqual(['india']);
    expect(toggleScopeKey(['india', 'eu'], 'all')).toBe('all');
  });
  it('accepts a list from the form and refuses an empty one', () => {
    expect(staffScopesSchema.parse(['india', 'eu'])).toEqual(['india', 'eu']);
    expect(staffScopesSchema.parse(['all'])).toBe('all');
    expect(staffScopesSchema.safeParse([]).success).toBe(false);
    expect(staffScopesSchema.safeParse(['Not A Key']).success).toBe(false);
  });
});
