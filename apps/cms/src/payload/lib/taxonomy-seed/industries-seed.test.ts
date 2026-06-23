import { describe, expect, it } from 'vitest';

import { CaseStudies } from '../../collections/CaseStudies';
import { INDUSTRIES_SEED } from './industries-seed';

type SelectField = { name?: string; type?: string; options?: { value: string }[] };

const enumValues = (): string[] => {
  const field = (CaseStudies.fields as SelectField[]).find(
    (f) => f.name === 'industry' && f.type === 'select',
  );
  if (!field?.options) throw new Error('CaseStudies industry select not found');
  return field.options.map((o) => o.value);
};

describe('INDUSTRIES_SEED', () => {
  it('has unique slugs', () => {
    const slugs = INDUSTRIES_SEED.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('matches the CaseStudies industry enum exactly (no drift)', () => {
    const seedSlugs = [...INDUSTRIES_SEED.map((t) => t.slug)].sort();
    const enumSlugs = [...enumValues()].sort();
    expect(seedSlugs).toEqual(enumSlugs);
  });
});
