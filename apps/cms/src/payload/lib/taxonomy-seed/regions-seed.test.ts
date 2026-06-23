import { describe, expect, it } from 'vitest';

import { News } from '../../collections/News';
import { Webinars } from '../../collections/Webinars';
import { REGIONS_SEED } from './regions-seed';

type SelectField = { name?: string; type?: string; options?: { value: string }[] };

const regionValues = (collection: { fields: unknown[] }): string[] => {
  const field = (collection.fields as SelectField[]).find(
    (f) => f.name === 'region' && f.type === 'select',
  );
  if (!field?.options) throw new Error('region select not found');
  return field.options.map((o) => o.value);
};

describe('REGIONS_SEED', () => {
  it('has unique slugs', () => {
    const slugs = REGIONS_SEED.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('is a superset of both the News and Webinars region enums (no value dropped)', () => {
    const seed = new Set(REGIONS_SEED.map((t) => t.slug));
    const union = new Set([...regionValues(News), ...regionValues(Webinars)]);
    for (const value of union) {
      expect(seed.has(value), `regions seed is missing "${value}"`).toBe(true);
    }
  });
});
