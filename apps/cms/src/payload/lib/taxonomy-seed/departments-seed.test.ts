import { describe, expect, it } from 'vitest';

import { Jobs } from '../../collections/Jobs';
import { DEPARTMENTS_SEED } from './departments-seed';

type SelectField = { name?: string; type?: string; options?: { value: string }[] };

const enumValues = (): string[] => {
  const field = (Jobs.fields as SelectField[]).find(
    (f) => f.name === 'department' && f.type === 'select',
  );
  if (!field?.options) throw new Error('Jobs department select not found');
  return field.options.map((o) => o.value);
};

describe('DEPARTMENTS_SEED', () => {
  it('has unique slugs', () => {
    const slugs = DEPARTMENTS_SEED.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('matches the Jobs department enum exactly (no drift)', () => {
    const seedSlugs = [...DEPARTMENTS_SEED.map((t) => t.slug)].sort();
    const enumSlugs = [...enumValues()].sort();
    expect(seedSlugs).toEqual(enumSlugs);
  });
});
