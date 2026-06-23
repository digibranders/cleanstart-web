import { describe, expect, it } from 'vitest';

import { Resources } from '../../collections/Resources';
import { RESOURCE_TYPES_SEED } from './resource-types-seed';

type SelectField = { name?: string; type?: string; options?: { value: string }[] };

const enumValues = (): string[] => {
  const field = (Resources.fields as SelectField[]).find(
    (f) => f.name === 'type' && f.type === 'select',
  );
  if (!field?.options) throw new Error('Resources type select not found');
  return field.options.map((o) => o.value);
};

describe('RESOURCE_TYPES_SEED', () => {
  it('has unique slugs', () => {
    const slugs = RESOURCE_TYPES_SEED.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('matches the Resources type enum exactly (no drift)', () => {
    const seedSlugs = [...RESOURCE_TYPES_SEED.map((t) => t.slug)].sort();
    const enumSlugs = [...enumValues()].sort();
    expect(seedSlugs).toEqual(enumSlugs);
  });
});
