import { describe, expect, it } from 'vitest';

import { humaniseFilename } from './humanise-filename';

describe('humaniseFilename', () => {
  it('strips the extension and capitalises', () => {
    expect(humaniseFilename('sbom.jpg')).toBe('Sbom');
  });

  it('replaces hyphens and underscores with spaces', () => {
    expect(humaniseFilename('sbom-101_overview.png')).toBe('Sbom 101 overview');
  });

  it('strips trailing content-hash suffix', () => {
    expect(humaniseFilename('sbom-101-a1b2c3d4.jpg')).toBe('Sbom 101');
  });

  it('handles uppercase hash suffix', () => {
    expect(humaniseFilename('hero_DEADBEEF.webp')).toBe('Hero');
  });

  it('preserves a short numeric segment that is not a hash', () => {
    expect(humaniseFilename('release-v2-notes.pdf')).toBe('Release v2 notes');
  });

  it('returns empty string for filename of only separators', () => {
    expect(humaniseFilename('___.jpg')).toBe('');
  });

  it('collapses runs of separators', () => {
    expect(humaniseFilename('one--two___three.png')).toBe('One two three');
  });
});
