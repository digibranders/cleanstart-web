import { describe, expect, it } from 'vitest';

import { normalise, type StoredValue, toIdValue, toStored } from './relationship-value';

describe('normalise', () => {
  it('returns an empty list for null/undefined', () => {
    expect(normalise(null, 'authors')).toEqual([]);
    expect(normalise(undefined, 'authors')).toEqual([]);
  });

  it('wraps a single numeric id, stringifying for internal use', () => {
    expect(normalise(7, 'authors')).toEqual([{ id: '7', relationTo: 'authors' }]);
  });

  it('normalises an array of numeric ids', () => {
    expect(normalise([7, 4], 'authors')).toEqual([
      { id: '7', relationTo: 'authors' },
      { id: '4', relationTo: 'authors' },
    ]);
  });

  it('reads relationTo from polymorphic entries', () => {
    expect(normalise([{ relationTo: 'guides', value: 9 }], 'authors')).toEqual([
      { id: '9', relationTo: 'guides' },
    ]);
  });

  it('skips null holes inside an array', () => {
    // Types forbid null array elements, but Payload form state can carry them;
    // the runtime guard defends against it, so exercise it via a cast.
    expect(normalise([7, null, 4] as unknown as StoredValue, 'authors')).toEqual([
      { id: '7', relationTo: 'authors' },
      { id: '4', relationTo: 'authors' },
    ]);
  });
});

describe('toIdValue', () => {
  it('restores canonical non-negative integer strings to numbers', () => {
    expect(toIdValue('7')).toBe(7);
    expect(toIdValue('0')).toBe(0);
    expect(toIdValue('4')).toBe(4);
  });

  it('leaves non-integer / ambiguous ids as strings', () => {
    expect(toIdValue('007')).toBe('007');
    expect(toIdValue('7.0')).toBe('7.0');
    expect(toIdValue('1e3')).toBe('1e3');
    expect(toIdValue('-1')).toBe('-1');
    expect(toIdValue('')).toBe('');
    expect(toIdValue('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });
});

describe('toStored', () => {
  // Regression: the field used to write back string ids, which Payload's
  // isValidID(value, 'number') rejects on serial-PK collections, surfacing
  // "This relationship field has the following invalid relationships: 7 0".
  it('writes a hasMany relationship as numeric ids for number-PK collections', () => {
    expect(toStored([{ id: '7', relationTo: 'authors' }], 'authors', true)).toEqual([7]);
  });

  it('writes a single relationship as a bare numeric id', () => {
    expect(toStored([{ id: '4', relationTo: 'authors' }], 'authors', false)).toBe(4);
  });

  it('returns null for an empty single relationship', () => {
    expect(toStored([], 'authors', false)).toBeNull();
  });

  it('returns an empty array for an empty hasMany relationship', () => {
    expect(toStored([], 'authors', true)).toEqual([]);
  });

  it('preserves polymorphic { relationTo, value } shape with a numeric value', () => {
    expect(toStored([{ id: '9', relationTo: 'guides' }], ['blogs', 'guides'], true)).toEqual([
      { relationTo: 'guides', value: 9 },
    ]);
  });

  it('keeps genuinely non-numeric ids as strings (uuid/text-PK collections)', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(toStored([{ id: uuid, relationTo: 'things' }], 'things', false)).toBe(uuid);
  });

  it('round-trips a DB-loaded value through normalise → toStored unchanged in type', () => {
    const fromDb = [7, 4];
    const entries = normalise(fromDb, 'authors');
    expect(toStored(entries, 'authors', true)).toEqual([7, 4]);
  });
});
