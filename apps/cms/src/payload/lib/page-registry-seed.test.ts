import { describe, expect, it } from 'vitest';

import { PAGE_REGISTRY_SEED, assertPageRegistrySeedValid } from './page-registry-seed';

describe('page-registry seed', () => {
  it('is internally valid (unique site-relative paths, templates carry a collection)', () => {
    expect(() => assertPageRegistrySeedValid()).not.toThrow();
  });

  it('has unique paths', () => {
    const paths = PAGE_REGISTRY_SEED.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('every row declares a schemaType', () => {
    for (const row of PAGE_REGISTRY_SEED) {
      expect(row.schemaType, row.path).toBeTruthy();
    }
  });

  it('every cms-listing / cms-template row names a backing collection', () => {
    for (const row of PAGE_REGISTRY_SEED) {
      if (row.kind === 'cms-listing' || row.kind === 'cms-template') {
        expect(row.backingCollection, row.path).toBeTruthy();
      }
    }
  });

  it('covers the known static + listing + template route counts', () => {
    const byKind = (k: string) => PAGE_REGISTRY_SEED.filter((r) => r.kind === k).length;
    expect(byKind('static')).toBeGreaterThanOrEqual(20);
    expect(byKind('cms-listing')).toBeGreaterThanOrEqual(10);
    expect(byKind('cms-template')).toBeGreaterThanOrEqual(8);
  });
});
