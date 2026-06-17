import { describe, expect, it } from 'vitest';

import {
  altLeaksVendorId,
  docDerivedAlt,
  docDerivedStem,
  extractContentHash,
  extractLeadingVendorId,
  humaniseSourceName,
  roleSuffix,
  webflowHumanName,
} from './clean-media-name';

describe('roleSuffix', () => {
  it('maps known roles', () => {
    expect(roleSuffix('heroImage')).toBe('hero');
    expect(roleSuffix('coverImage')).toBe('cover');
    expect(roleSuffix('companyLogo')).toBe('logo');
    expect(roleSuffix('asset')).toBe('asset');
  });
  it('falls back to "image" for unknown roles', () => {
    expect(roleSuffix('whatever')).toBe('image');
  });
});

describe('docDerivedStem', () => {
  it('uses just the doc slug for a single-image document', () => {
    expect(docDerivedStem('nist-800-53-kubernetes-control-mapping', 'heroImage', false)).toBe(
      'nist-800-53-kubernetes-control-mapping',
    );
  });
  it('appends the role suffix when the document has multiple images', () => {
    expect(docDerivedStem('iifl-finance', 'coverImage', true)).toBe('iifl-finance-cover');
    expect(docDerivedStem('iifl-finance', 'companyLogo', true)).toBe('iifl-finance-logo');
    expect(docDerivedStem('iifl-finance', 'asset', true)).toBe('iifl-finance-asset');
  });
});

describe('docDerivedAlt', () => {
  it('uses the document title verbatim for primary images', () => {
    expect(docDerivedAlt('NIST 800-53 Kubernetes Control Mapping', 'heroImage')).toBe(
      'NIST 800-53 Kubernetes Control Mapping',
    );
  });
  it('adds a role word for logos and icons', () => {
    expect(docDerivedAlt('IIFL Finance', 'companyLogo')).toBe('IIFL Finance logo');
    expect(docDerivedAlt('Containers', 'icon')).toBe('Containers icon');
  });
});

describe('altLeaksVendorId', () => {
  it('detects a leaked id alt and ignores human alts', () => {
    expect(altLeaksVendorId('6a102c0f3f256301e63ecc97 chart 20 53')).toBe(true);
    expect(altLeaksVendorId('Attack surface diagram')).toBe(false);
    expect(altLeaksVendorId('')).toBe(false);
    expect(altLeaksVendorId(null)).toBe(false);
  });
});

describe('extractContentHash', () => {
  it('returns the trailing import hash', () => {
    expect(extractContentHash('6a102c0f3f256301e63ecc97-chart-20-53-af8cc43f')).toBe('af8cc43f');
  });
  it('returns null when absent', () => {
    expect(extractContentHash('chart-20-53')).toBe(null);
  });
});

describe('extractLeadingVendorId', () => {
  it('returns the leading id and ignores clean names', () => {
    expect(extractLeadingVendorId('6a102c0f3f256301e63ecc97-chart-20-53-af8cc43f.webp')).toBe(
      '6a102c0f3f256301e63ecc97',
    );
    expect(extractLeadingVendorId('aurascape-7fd35e18.webp')).toBe(null);
  });
});

describe('webflowHumanName', () => {
  it('decodes the original %20-encoded name, stripping id(s) + extension', () => {
    expect(
      webflowHumanName(
        'https://cdn.prod.website-files.com/site/69b7d896f2c4a3f9df52bb67_WhatsApp%20Image%202026-03-16%20at%201.37.14%20PM.jpeg',
      ),
    ).toBe('WhatsApp Image 2026-03-16 at 1.37.14 PM');
  });
  it('strips two stacked ids', () => {
    expect(
      webflowHumanName(
        'https://cdn.prod.website-files.com/s/6895e798224f3706e5dd9cec_6895e713b5dac976bd052796_P1273410-min.jpg',
      ),
    ).toBe('P1273410-min');
  });
  it('returns empty for an unparseable url', () => {
    expect(webflowHumanName('not a url')).toBe('');
  });
});

describe('humaniseSourceName', () => {
  it('humanises a fallback name', () => {
    expect(humaniseSourceName('chart-20-53')).toBe('Chart 20 53');
  });
});
