import { describe, expect, it } from 'vitest';

import {
  ALLOWED_OVERRIDE_TYPES,
  validateOverride,
  validateOverrideForField,
} from './override-validator';

const valid = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Hi',
};

describe('validateOverride', () => {
  it('treats null/undefined as a no-op valid result', () => {
    expect(validateOverride(null).ok).toBe(true);
    expect(validateOverride(undefined).ok).toBe(true);
  });

  it('accepts a single allowlisted override', () => {
    expect(validateOverride(valid).ok).toBe(true);
  });

  it('accepts a non-empty array of overrides', () => {
    expect(
      validateOverride([
        valid,
        { '@context': 'https://schema.org', '@type': 'FAQPage' },
      ]).ok,
    ).toBe(true);
  });

  it('rejects an empty array', () => {
    const result = validateOverride([]);
    expect(result.ok).toBe(false);
  });

  it('rejects when @context is wrong', () => {
    const result = validateOverride({ ...valid, '@context': 'http://schema.org' });
    expect(result.ok).toBe(false);
  });

  it('rejects @type values not on the allowlist', () => {
    const result = validateOverride({
      ...valid,
      '@type': 'MedicalCondition',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects nested @id references but allows top-level @id', () => {
    expect(
      validateOverride({
        ...valid,
        '@id': 'https://example.com/page#article',
        author: {
          '@id': 'https://attacker.example/x',
          '@type': 'Person',
          name: 'X',
        },
      }).ok,
    ).toBe(false);

    expect(
      validateOverride({
        ...valid,
        '@id': 'https://example.com/page#article',
      }).ok,
    ).toBe(true);
  });

  it('rejects payloads larger than 16 KiB', () => {
    const big = { ...valid, blob: 'a'.repeat(20_000) };
    const result = validateOverride(big);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/exceeds/);
  });

  it('rejects unserialisable inputs (circular references)', () => {
    const obj: Record<string, unknown> = { ...valid };
    obj.self = obj;
    const result = validateOverride(obj);
    expect(result.ok).toBe(false);
  });

  it('exposes a stable allowlist for callers', () => {
    expect(ALLOWED_OVERRIDE_TYPES).toContain('Article');
    expect(ALLOWED_OVERRIDE_TYPES).not.toContain('MedicalCondition');
  });
});

describe('validateOverrideForField', () => {
  it('returns true on success', () => {
    expect(validateOverrideForField(valid)).toBe(true);
  });

  it('returns a string error message on failure', () => {
    const out = validateOverrideForField({ ...valid, '@type': 'Bogus' });
    expect(typeof out).toBe('string');
  });
});
