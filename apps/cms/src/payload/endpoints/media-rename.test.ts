import { describe, expect, it } from 'vitest';

import { __internals } from './media-rename';

const { splitFilename, renameDerivative, planCopies } = __internals;

describe('splitFilename', () => {
  it('splits stem and extension', () => {
    expect(splitFilename('logo.webp')).toEqual({ stem: 'logo', ext: '.webp' });
  });

  it('handles multi-dot filenames', () => {
    expect(splitFilename('archive.tar.gz')).toEqual({
      stem: 'archive.tar',
      ext: '.gz',
    });
  });

  it('returns empty ext for dotless filename', () => {
    expect(splitFilename('LICENSE')).toEqual({ stem: 'LICENSE', ext: '' });
  });

  it('trims whitespace', () => {
    expect(splitFilename('  logo.webp  ')).toEqual({ stem: 'logo', ext: '.webp' });
  });
});

describe('renameDerivative', () => {
  it('swaps the leading stem when it matches', () => {
    expect(renameDerivative('logo-400x400.webp', 'logo', 'brand-mark')).toBe(
      'brand-mark-400x400.webp',
    );
  });

  it('leaves the derivative untouched when the stem does not match', () => {
    expect(renameDerivative('other-400x400.webp', 'logo', 'brand-mark')).toBe(
      'other-400x400.webp',
    );
  });

  it('respects a hash-suffix stem exactly', () => {
    expect(
      renameDerivative('logo-a1b2c3d4-thumb.webp', 'logo-a1b2c3d4', 'brand-mark'),
    ).toBe('brand-mark-thumb.webp');
  });
});

describe('planCopies', () => {
  it('plans copies for main + all sizes whose stem matches', () => {
    const { plan, sizeRenames } = planCopies(
      'dev/author',
      'logo-a1b2c3d4.webp',
      'brand-mark.webp',
      {
        thumb: { filename: 'logo-a1b2c3d4-400x400.webp' },
        card: { filename: 'logo-a1b2c3d4-800x800.webp' },
      },
    );
    expect(plan).toHaveLength(3);
    expect(plan[0]).toEqual({
      oldKey: 'dev/author/logo-a1b2c3d4.webp',
      newKey: 'dev/author/brand-mark.webp',
    });
    expect(sizeRenames).toEqual({
      thumb: 'brand-mark-400x400.webp',
      card: 'brand-mark-800x800.webp',
    });
  });

  it('skips sizes whose filename does not share the parent stem', () => {
    const { plan, sizeRenames } = planCopies(
      'dev/author',
      'logo.webp',
      'brand-mark.webp',
      {
        thumb: { filename: 'logo-400x400.webp' },
        weird: { filename: 'unrelated-stem-thumb.webp' },
      },
    );
    // Main + thumb only.
    expect(plan).toHaveLength(2);
    expect(sizeRenames).toEqual({ thumb: 'brand-mark-400x400.webp' });
  });

  it('returns no size renames when sizes is null or empty', () => {
    const { plan, sizeRenames } = planCopies(
      'dev/general',
      'old.webp',
      'new.webp',
      null,
    );
    expect(plan).toHaveLength(1);
    expect(sizeRenames).toEqual({});
  });

  it('omits sizes without a filename', () => {
    const { plan } = planCopies('dev/page', 'a.webp', 'b.webp', {
      thumb: { width: 400, height: 400 } as { width: number; height: number },
    });
    expect(plan).toHaveLength(1);
  });
});
