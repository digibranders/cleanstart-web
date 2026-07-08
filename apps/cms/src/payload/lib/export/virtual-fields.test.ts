import { describe, expect, it } from 'vitest';

import { getByPath, resolveVirtualFieldPath, VIRTUAL_FIELD_SOURCE_PATH } from './virtual-fields';

describe('resolveVirtualFieldPath', () => {
  it('redirects all 5 mapped SEO sidebar field names', () => {
    expect(resolveVirtualFieldPath('seoTitle')).toBe('seo.title');
    expect(resolveVirtualFieldPath('seoDescription')).toBe('seo.description');
    expect(resolveVirtualFieldPath('seoIndexable')).toBe('seo.indexable');
    expect(resolveVirtualFieldPath('canonicalUrl')).toBe('seo.canonicalOverride');
    expect(resolveVirtualFieldPath('socialCard')).toBe('seo.ogImage');
  });

  it('passes an unmapped field name through unchanged', () => {
    expect(resolveVirtualFieldPath('title')).toBe('title');
    expect(resolveVirtualFieldPath('publishedAt')).toBe('publishedAt');
    expect(resolveVirtualFieldPath('__schemaTypes')).toBe('__schemaTypes');
  });

  it('the exported map has exactly the 5 documented entries', () => {
    expect(Object.keys(VIRTUAL_FIELD_SOURCE_PATH).sort()).toEqual(
      ['canonicalUrl', 'seoDescription', 'seoIndexable', 'seoTitle', 'socialCard'].sort(),
    );
  });
});

describe('getByPath', () => {
  it('resolves a nested hit', () => {
    expect(getByPath({ seo: { title: 'Hello' } }, 'seo.title')).toBe('Hello');
  });

  it('returns undefined for a missing key at the leaf', () => {
    expect(getByPath({ seo: {} }, 'seo.title')).toBeUndefined();
  });

  it('returns undefined for a missing key at an intermediate segment', () => {
    expect(getByPath({}, 'seo.title')).toBeUndefined();
  });

  it('returns undefined when an intermediate value is not an object', () => {
    expect(getByPath({ seo: 'not-an-object' }, 'seo.title')).toBeUndefined();
  });

  it('returns undefined when the root itself is not an object', () => {
    expect(getByPath(null, 'seo.title')).toBeUndefined();
    expect(getByPath('string', 'seo.title')).toBeUndefined();
  });

  it('resolves a top-level flat key (degenerate single-segment path)', () => {
    expect(getByPath({ title: 'Hello' }, 'title')).toBe('Hello');
  });
});
