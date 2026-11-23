import { describe, expect, it } from 'vitest';
import {
  checkRegionName,
  offerableRegions,
  type RegionDto,
  regionKeySchema,
  regionName,
  regionTeamLabel,
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
