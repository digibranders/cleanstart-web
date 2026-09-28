import { describe, expect, it } from 'vitest';

import type { ListFilterFieldConfig } from './list-filter-config';
import { selectionsFromWhere, whereWithSelections } from './list-filter-where';

const FIELDS: ReadonlyArray<ListFilterFieldConfig> = [
  { kind: 'relationship', name: 'categories', label: 'Category', relationTo: 'categories' },
  { kind: 'relationship', name: 'authors', label: 'Author', relationTo: 'authors' },
  {
    kind: 'options',
    name: '_status',
    label: 'Status',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
    ],
  },
];

describe('selectionsFromWhere', () => {
  it('returns empty selections for an empty where', () => {
    expect(selectionsFromWhere({}, FIELDS)).toEqual({
      categories: [],
      authors: [],
      _status: [],
    });
  });

  it('reads a single-field where (no `and` wrapper)', () => {
    expect(selectionsFromWhere({ categories: { in: ['1', '2'] } }, FIELDS)).toEqual({
      categories: ['1', '2'],
      authors: [],
      _status: [],
    });
  });

  it('reads multiple fields from an `and` where', () => {
    const where = {
      and: [{ categories: { in: ['1'] } }, { _status: { in: ['draft'] } }],
    };
    expect(selectionsFromWhere(where, FIELDS)).toEqual({
      categories: ['1'],
      authors: [],
      _status: ['draft'],
    });
  });

  it('ignores conditions for fields this bar does not manage', () => {
    const where = { and: [{ search: { like: 'foo' } }, { categories: { in: ['1'] } }] };
    expect(selectionsFromWhere(where, FIELDS).categories).toEqual(['1']);
  });
});

describe('whereWithSelections', () => {
  it('returns {} when nothing is selected and no other conditions exist', () => {
    expect(whereWithSelections({}, FIELDS, {})).toEqual({});
  });

  it('produces a bare single-key where for exactly one selected field', () => {
    expect(whereWithSelections({}, FIELDS, { categories: ['1', '2'] })).toEqual({
      categories: { in: ['1', '2'] },
    });
  });

  it('combines multiple selected fields under `and`', () => {
    const next = whereWithSelections({}, FIELDS, {
      categories: ['1'],
      _status: ['draft', 'published'],
    });
    expect(next).toEqual({
      and: [{ categories: { in: ['1'] } }, { _status: { in: ['draft', 'published'] } }],
    });
  });

  it('preserves an unmanaged existing condition alongside new selections', () => {
    const currentWhere = { and: [{ title: { like: 'foo' } }] };
    const next = whereWithSelections(currentWhere, FIELDS, { categories: ['1'] });
    expect(next).toEqual({
      and: [{ title: { like: 'foo' } }, { categories: { in: ['1'] } }],
    });
  });

  it('drops a field entirely when it is deselected', () => {
    const currentWhere = { and: [{ categories: { in: ['1'] } }, { authors: { in: ['9'] } }] };
    const next = whereWithSelections(currentWhere, FIELDS, { authors: ['9'] });
    expect(next).toEqual({ authors: { in: ['9'] } });
  });
});
