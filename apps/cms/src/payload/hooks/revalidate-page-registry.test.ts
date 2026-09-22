import { describe, expect, it } from 'vitest';

import { pageRegistryCacheTag, pageRegistryRevalidatePath } from './revalidate-page-registry';

describe('pageRegistryRevalidatePath', () => {
  it('returns the path for static and listing rows', () => {
    expect(pageRegistryRevalidatePath({ path: '/cleansight', kind: 'static' })).toBe('/cleansight');
    expect(pageRegistryRevalidatePath({ path: '/blogs', kind: 'cms-listing' })).toBe('/blogs');
  });

  it('returns null for cms-template rows (placeholder [slug] path, not a real URL)', () => {
    expect(pageRegistryRevalidatePath({ path: '/blogs/[slug]', kind: 'cms-template' })).toBeNull();
  });

  it('returns null when path is missing', () => {
    expect(pageRegistryRevalidatePath({ kind: 'static' })).toBeNull();
    expect(pageRegistryRevalidatePath({ path: '', kind: 'static' })).toBeNull();
  });
});

/**
 * The tag is a contract with apps/web: `pageRegistryTag` in
 * apps/web/src/lib/page-registry.ts must produce the identical string, or a
 * registry edit purges a tag nothing reads and the page silently serves the
 * old row for up to 24h. Both sides assert the same literals.
 */
describe('pageRegistryCacheTag', () => {
  it('matches the literal apps/web tags its registry read with', () => {
    expect(pageRegistryCacheTag('/compare')).toBe('page-registry:/compare');
    expect(pageRegistryCacheTag('/tricorder')).toBe('page-registry:/tricorder');
    expect(pageRegistryCacheTag('/industries/financial-services')).toBe(
      'page-registry:/industries/financial-services',
    );
  });
});
