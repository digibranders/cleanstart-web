import { describe, expect, it } from 'vitest';

import { Webinars } from '../../collections/Webinars';
import { WEBINAR_TYPES_SEED } from './webinar-types-seed';

type SelectField = { name?: string; type?: string; options?: { value: string }[] };

const enumValues = (): string[] => {
  const field = (Webinars.fields as SelectField[]).find(
    (f) => f.name === 'webinarType' && f.type === 'select',
  );
  if (!field?.options) throw new Error('Webinars webinarType select not found');
  return field.options.map((o) => o.value);
};

describe('WEBINAR_TYPES_SEED', () => {
  it('has unique slugs', () => {
    const slugs = WEBINAR_TYPES_SEED.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('matches the Webinars webinarType enum exactly (no drift)', () => {
    const seedSlugs = [...WEBINAR_TYPES_SEED.map((t) => t.slug)].sort();
    const enumSlugs = [...enumValues()].sort();
    expect(seedSlugs).toEqual(enumSlugs);
  });
});
