import { describe, expect, it } from 'vitest';

import { CURATED_DEFAULT_COLUMNS, resolveCuratedDefaultColumns } from './export-default-columns';

describe('resolveCuratedDefaultColumns', () => {
  it('returns null for a collection with no curated entry', () => {
    expect(resolveCuratedDefaultColumns('news', new Set(['title', 'slug']))).toBeNull();
  });

  it('returns the full curated list when every entry is present', () => {
    const allNames = new Set(CURATED_DEFAULT_COLUMNS.blogs);
    expect(resolveCuratedDefaultColumns('blogs', allNames)).toEqual(CURATED_DEFAULT_COLUMNS.blogs);
  });

  it('intersects the curated list with the actual exportable field names, preserving curated order', () => {
    const available = new Set(['title', 'slug', 'publishedAt', 'updatedAt']);
    expect(resolveCuratedDefaultColumns('blogs', available)).toEqual([
      'title',
      'slug',
      'publishedAt',
      'updatedAt',
    ]);
  });

  it('drops a stale/renamed curated entry that no longer exists on the collection', () => {
    const blogsColumns = CURATED_DEFAULT_COLUMNS.blogs ?? [];
    const available = new Set(blogsColumns.filter((n) => n !== 'socialCard'));
    const result = resolveCuratedDefaultColumns('blogs', available);
    expect(result).not.toBeNull();
    expect(result).not.toContain('socialCard');
  });

  it('returns null (not an empty array) when the intersection is empty', () => {
    expect(resolveCuratedDefaultColumns('blogs', new Set(['someUnrelatedField']))).toBeNull();
  });

  it('preselects the curated deal-registrations columns', () => {
    const curated = CURATED_DEFAULT_COLUMNS['deal-registrations'] ?? [];
    expect(curated).toContain('partnerName');
    expect(curated).toContain('hubspotSync');
    expect(curated).toContain('source');
    expect(curated).not.toContain('honeypot');
    expect(resolveCuratedDefaultColumns('deal-registrations', new Set(curated))).toEqual(curated);
  });
});
