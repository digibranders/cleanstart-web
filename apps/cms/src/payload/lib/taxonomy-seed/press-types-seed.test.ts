import { describe, expect, it } from 'vitest';

import { News } from '../../collections/News';
import { PRESS_TYPES_SEED } from './press-types-seed';

type SelectField = { name?: string; type?: string; options?: { value: string }[] };

const enumValues = (): string[] => {
  const field = (News.fields as SelectField[]).find(
    (f) => f.name === 'pressType' && f.type === 'select',
  );
  if (!field?.options) throw new Error('News pressType select not found');
  return field.options.map((o) => o.value);
};

describe('PRESS_TYPES_SEED', () => {
  it('has unique slugs', () => {
    const slugs = PRESS_TYPES_SEED.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('matches the News pressType enum exactly (no drift)', () => {
    const seedSlugs = [...PRESS_TYPES_SEED.map((t) => t.slug)].sort();
    const enumSlugs = [...enumValues()].sort();
    expect(seedSlugs).toEqual(enumSlugs);
  });
});
