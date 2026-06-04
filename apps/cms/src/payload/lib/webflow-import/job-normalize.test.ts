import { describe, expect, it } from 'vitest';

import {
  normalizeDepartment,
  normalizeEmploymentType,
  normalizeExperienceLevel,
  normalizeExperienceRange,
  normalizeJobLegacyRows,
} from './job-normalize';

describe('normalizeExperienceRange', () => {
  it('standardises dashes and Title-cases Year(s)', () => {
    expect(normalizeExperienceRange('3-10 years')).toBe('3-10 Years');
    expect(normalizeExperienceRange('1–3 Years')).toBe('1-3 Years');
    expect(normalizeExperienceRange('0-1 year')).toBe('0-1 Year');
    expect(normalizeExperienceRange('5+ years')).toBe('5+ Years');
    expect(normalizeExperienceRange('  4–6  Years ')).toBe('4-6 Years');
  });

  it('returns undefined for blank / non-string', () => {
    expect(normalizeExperienceRange('')).toBeUndefined();
    expect(normalizeExperienceRange('   ')).toBeUndefined();
    expect(normalizeExperienceRange(null)).toBeUndefined();
    expect(normalizeExperienceRange(42)).toBeUndefined();
  });
});

describe('normalizeDepartment', () => {
  it('maps the canonical names case-insensitively', () => {
    expect(normalizeDepartment('Engineering')).toBe('engineering');
    expect(normalizeDepartment('SALES')).toBe('sales');
    expect(normalizeDepartment('  Marketing  ')).toBe('marketing');
  });
  it('maps known aliases', () => {
    expect(normalizeDepartment('eng')).toBe('engineering');
    expect(normalizeDepartment('Customer Support')).toBe('customer-success');
    expect(normalizeDepartment('HR')).toBe('people');
    expect(normalizeDepartment('Business Development')).toBe('sales');
  });
  it('returns null for unrecognized values', () => {
    expect(normalizeDepartment('Director of Strategy')).toBeNull();
    expect(normalizeDepartment('')).toBeNull();
    expect(normalizeDepartment(null)).toBeNull();
    expect(normalizeDepartment(42)).toBeNull();
  });
});

describe('normalizeEmploymentType', () => {
  it('handles dashes / spaces / capitalisation variants', () => {
    expect(normalizeEmploymentType('Full Time')).toBe('full-time');
    expect(normalizeEmploymentType('full-time')).toBe('full-time');
    expect(normalizeEmploymentType('FULLTIME')).toBe('full-time');
  });
  it('maps semantic synonyms', () => {
    expect(normalizeEmploymentType('Permanent')).toBe('full-time');
    expect(normalizeEmploymentType('Freelance')).toBe('contract');
    expect(normalizeEmploymentType('Intern')).toBe('internship');
  });
  it('returns null for unknown shapes', () => {
    expect(normalizeEmploymentType('Tier-2')).toBeNull();
  });
});

describe('normalizeExperienceLevel', () => {
  it('maps named levels', () => {
    expect(normalizeExperienceLevel('Senior')).toBe('senior');
    expect(normalizeExperienceLevel('Sr')).toBe('senior');
    expect(normalizeExperienceLevel('Lead')).toBe('staff');
  });
  it('infers from year-range strings', () => {
    expect(normalizeExperienceLevel('1 year')).toBe('entry');
    expect(normalizeExperienceLevel('5+ years')).toBe('mid');
    expect(normalizeExperienceLevel('8 yrs')).toBe('senior');
    expect(normalizeExperienceLevel('12 years')).toBe('staff');
    expect(normalizeExperienceLevel('15+ years')).toBe('principal');
  });
  it('returns null when nothing maps', () => {
    expect(normalizeExperienceLevel('Strong communicator')).toBeNull();
  });
});

describe('normalizeJobLegacyRows', () => {
  it('returns per-row enums and surfaces unmapped values', () => {
    const result = normalizeJobLegacyRows([
      { index: 0, slug: 'a', department: 'Engineering', timing: 'Full-time', experience: 'Senior' },
      { index: 1, slug: 'b', department: 'Director of Sales', timing: 'gig', experience: 'great' },
    ]);
    expect(result[0]).toMatchObject({
      department: 'engineering',
      employmentType: 'full-time',
      experienceLevel: 'senior',
      unmapped: [],
    });
    expect(result[1]?.department).toBeNull();
    expect(result[1]?.employmentType).toBeNull();
    expect(result[1]?.experienceLevel).toBeNull();
    expect(result[1]?.unmapped).toEqual([
      'department="Director of Sales"',
      'timing="gig"',
      'experience="great"',
    ]);
  });
});
