import { describe, expect, it } from 'vitest';

import {
  buildMediaFilename,
  canonicalExtensionForMime,
  looksLikeJunkSlug,
  pickSlugSource,
  shortHash,
  stripVendorAssetIdPrefix,
} from './media-filename';
import { ALLOWED_MIME_TYPES } from './upload-limits';

describe('shortHash', () => {
  it('is deterministic for the same bytes', () => {
    const a = shortHash(Buffer.from('hello world'));
    const b = shortHash(Buffer.from('hello world'));
    expect(a).toBe(b);
    expect(a).toHaveLength(8);
  });

  it('differs for different bytes', () => {
    expect(shortHash(Buffer.from('a'))).not.toBe(shortHash(Buffer.from('b')));
  });
});

describe('canonicalExtensionForMime', () => {
  it.each([
    ['image/jpeg', 'webp'],
    ['image/png', 'webp'],
    ['image/webp', 'webp'],
    ['image/gif', 'webp'],
    ['image/avif', 'webp'],
    ['IMAGE/JPEG', 'webp'],
  ])('raster %s → webp', (mime, expected) => {
    expect(canonicalExtensionForMime(mime)).toBe(expected);
  });

  it('passes through SVG, PDF, MP4, and ZIP', () => {
    expect(canonicalExtensionForMime('image/svg+xml')).toBe('svg');
    expect(canonicalExtensionForMime('application/pdf')).toBe('pdf');
    expect(canonicalExtensionForMime('video/mp4')).toBe('mp4');
    expect(canonicalExtensionForMime('application/zip')).toBe('zip');
    expect(canonicalExtensionForMime('application/x-zip-compressed')).toBe('zip');
  });

  it('falls back to bin for unknown types', () => {
    expect(canonicalExtensionForMime('application/octet-stream')).toBe('bin');
    expect(canonicalExtensionForMime(undefined)).toBe('bin');
    expect(canonicalExtensionForMime(null)).toBe('bin');
  });

  it('maps every allow-listed MIME type to a servable extension', () => {
    for (const mime of ALLOWED_MIME_TYPES) {
      expect(canonicalExtensionForMime(mime)).not.toBe('bin');
    }
  });
});

describe('buildMediaFilename', () => {
  const bytes = Buffer.from('the quick brown fox');

  it('produces the canonical {slug}-{hash}.{ext} shape', () => {
    const name = buildMediaFilename({
      slugSource: 'SBOM 101 cover',
      bytes,
      ext: 'webp',
    });
    expect(name).toMatch(/^sbom-101-cover-[0-9a-f]{8}\.webp$/);
  });

  it('NFKD-normalises accented characters', () => {
    const name = buildMediaFilename({
      slugSource: 'Café — façade!',
      bytes,
      ext: 'webp',
    });
    expect(name).toMatch(/^cafe-facade-[0-9a-f]{8}\.webp$/);
  });

  it('strips a leading dot from the extension and lowercases it', () => {
    const name = buildMediaFilename({
      slugSource: 'logo',
      bytes,
      ext: '.WEBP',
    });
    expect(name.endsWith('.webp')).toBe(true);
  });

  it('truncates the slug to the configured max length without dangling separator', () => {
    const name = buildMediaFilename({
      slugSource: 'a'.repeat(100),
      bytes,
      ext: 'webp',
      maxSlugLen: 10,
    });
    const slugPart = name.split('-').slice(0, -1).join('-');
    expect(slugPart.length).toBeLessThanOrEqual(10);
    expect(slugPart.endsWith('-')).toBe(false);
  });

  it('falls back to "asset" when slug source is unrepresentable', () => {
    const name = buildMediaFilename({
      slugSource: '...---___',
      bytes,
      ext: 'webp',
    });
    expect(name).toMatch(/^asset-[0-9a-f]{8}\.webp$/);
  });

  it('honours an explicit hashOverride', () => {
    const name = buildMediaFilename({
      slugSource: 'logo',
      bytes,
      ext: 'webp',
      hashOverride: 'deadbeef',
    });
    expect(name).toBe('logo-deadbeef.webp');
  });

  it('falls back to bin when extension is empty', () => {
    const name = buildMediaFilename({
      slugSource: 'logo',
      bytes,
      ext: '',
    });
    expect(name.endsWith('.bin')).toBe(true);
  });

  it('strips a leading Webflow asset-id prefix from the slug source', () => {
    // Webflow prepends a 24-char ObjectID; the humanised form arrives
    // space-separated, so the strip must survive slugification.
    const name = buildMediaFilename({
      slugSource: '6a102c0f3f256301e63ecc97 chart 20 53',
      bytes,
      ext: 'webp',
      hashOverride: 'deadbeef',
    });
    expect(name).toBe('chart-20-53-deadbeef.webp');
  });

  it('strips the asset-id prefix from an already-hyphenated source', () => {
    const name = buildMediaFilename({
      slugSource: '6a0d3888875b7180df53d767-chart-20-49',
      bytes,
      ext: 'webp',
      hashOverride: 'cafebabe',
    });
    expect(name).toBe('chart-20-49-cafebabe.webp');
  });

  it('does not strip when the id is the entire slug (nothing meaningful would remain)', () => {
    const name = buildMediaFilename({
      slugSource: '6a102c0f3f256301e63ecc97',
      bytes,
      ext: 'webp',
      hashOverride: 'deadbeef',
    });
    expect(name).toBe('6a102c0f3f256301e63ecc97-deadbeef.webp');
  });

  it('leaves a normal slug that merely starts with hex untouched', () => {
    // 12 hex chars is not the 24-char ObjectID shape — must not strip.
    const name = buildMediaFilename({
      slugSource: 'abc123def456-overview',
      bytes,
      ext: 'webp',
      hashOverride: 'deadbeef',
    });
    expect(name).toBe('abc123def456-overview-deadbeef.webp');
  });
});

describe('stripVendorAssetIdPrefix', () => {
  it('removes a leading 24-char hex ObjectID followed by a separator', () => {
    expect(stripVendorAssetIdPrefix('6a102c0f3f256301e63ecc97-chart-20-53')).toBe('chart-20-53');
  });

  it('returns the input unchanged when no id prefix is present', () => {
    expect(stripVendorAssetIdPrefix('attack-surface-diagram')).toBe('attack-surface-diagram');
  });

  it('returns the input unchanged when stripping would leave nothing', () => {
    expect(stripVendorAssetIdPrefix('6a102c0f3f256301e63ecc97')).toBe('6a102c0f3f256301e63ecc97');
  });

  it('strips two stacked 24-char ids (re-uploaded Webflow assets)', () => {
    expect(
      stripVendorAssetIdPrefix(
        '6895e798224f3706e5dd9cec-6895e713b5dac976bd052796-p1273410-min-s-f6954462',
      ),
    ).toBe('p1273410-min-s-f6954462');
  });

  it('does not strip a hex run that is not exactly 24 chars', () => {
    expect(stripVendorAssetIdPrefix('abc123-overview')).toBe('abc123-overview');
    expect(stripVendorAssetIdPrefix('6a102c0f3f256301e63ecc9-chart')).toBe(
      '6a102c0f3f256301e63ecc9-chart',
    );
  });
});

describe('looksLikeJunkSlug', () => {
  it.each([
    'image001',
    'IMG_3492',
    'clip_image002',
    'Picture 1',
    'picture',
    'pasted-1700000000000',
    'ingested-1234567890',
    'Untitled',
    'Untitled-1',
    'screenshot 2026-05-04 at 12.13',
    'a1b2c3d4e5f6',
    '00000',
    '',
    '   ',
    'ab',
  ])('flags %s as junk', (input) => {
    expect(looksLikeJunkSlug(input)).toBe(true);
  });

  it.each([
    'SBOM 101 cover',
    'Dhanush VM portrait',
    'Hero illustration for the resource',
    'attack-surface-diagram',
  ])('accepts %s as meaningful', (input) => {
    expect(looksLikeJunkSlug(input)).toBe(false);
  });
});

describe('pickSlugSource', () => {
  it('prefers alt when meaningful', () => {
    expect(
      pickSlugSource({ alt: 'SBOM cover', filename: 'image001', contextHint: 'blog-foo' }),
    ).toBe('SBOM cover');
  });

  it('falls through to filename when alt is junk', () => {
    expect(
      pickSlugSource({ alt: 'image001', filename: 'Real description', contextHint: 'blog-foo' }),
    ).toBe('Real description');
  });

  it('falls through to context hint when alt + filename are both junk', () => {
    expect(
      pickSlugSource({
        alt: 'image001',
        filename: 'clip_image003',
        contextHint: 'blog-getting-started-inline',
      }),
    ).toBe('blog-getting-started-inline');
  });

  it('uses junk alt as last-resort when nothing else is available', () => {
    expect(pickSlugSource({ alt: 'image001' })).toBe('image001');
  });

  it('returns empty when no source is provided', () => {
    expect(pickSlugSource({})).toBe('');
  });
});
