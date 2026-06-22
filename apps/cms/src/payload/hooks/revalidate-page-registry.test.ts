import { describe, expect, it } from 'vitest';

import { pageRegistryRevalidatePath } from './revalidate-page-registry';

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
