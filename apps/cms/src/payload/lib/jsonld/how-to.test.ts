import { describe, expect, it } from 'vitest';

import { buildJsonLdContext } from './context';
import { buildHowToBlob } from './how-to';

const ctx = buildJsonLdContext({
  siteSettings: {
    siteName: 'CleanStart',
    baseUrl: 'https://cleanstart.com',
    defaultLocale: 'en-US',
  },
  seoDefaults: {
    organizationJsonLd: {
      name: 'CleanStart, Inc.',
      url: 'https://cleanstart.com',
      logo: { url: 'https://cdn/logo.png' },
    },
  },
});

const baseSteps = [
  { heading: 'Generate the SBOM', body: 'Run syft to produce CycloneDX output.' },
  { heading: 'Sign with cosign', body: 'cosign sign-blob --key cosign.key sbom.json' },
];

describe('buildHowToBlob', () => {
  it('emits a valid HowTo with @id, name, step[], and url', () => {
    const blob = buildHowToBlob(ctx, {
      url: 'https://cleanstart.com/guide/sbom-howto',
      title: 'Sign your SBOM',
      steps: baseSteps,
    });
    expect(blob).toMatchObject({
      '@type': 'HowTo',
      '@id': 'https://cleanstart.com/guide/sbom-howto#howto',
      name: 'Sign your SBOM',
      step: [
        expect.objectContaining({
          '@type': 'HowToStep',
          position: 1,
          name: 'Generate the SBOM',
        }),
        expect.objectContaining({ position: 2, name: 'Sign with cosign' }),
      ],
    });
  });

  it('returns null when title or url is missing', () => {
    expect(
      buildHowToBlob(ctx, { url: '', title: 'X', steps: baseSteps }),
    ).toBeNull();
    expect(
      buildHowToBlob(ctx, {
        url: 'https://example.com/x',
        title: '',
        steps: baseSteps,
      }),
    ).toBeNull();
  });

  it('returns null when steps is empty (HowTo with 0 steps fails Rich Results)', () => {
    expect(
      buildHowToBlob(ctx, {
        url: 'https://cleanstart.com/guide/x',
        title: 'X',
        steps: [],
      }),
    ).toBeNull();
  });

  it('emits totalTime / prepTime / performTime / estimatedCost when set', () => {
    const blob = buildHowToBlob(ctx, {
      url: 'https://cleanstart.com/guide/x',
      title: 'X',
      steps: baseSteps,
      totalTime: 'PT30M',
      prepTime: 'PT5M',
      performTime: 'PT25M',
      estimatedCost: '$0',
    }) as Record<string, unknown>;
    expect(blob.totalTime).toBe('PT30M');
    expect(blob.prepTime).toBe('PT5M');
    expect(blob.performTime).toBe('PT25M');
    expect(blob.estimatedCost).toBe('$0');
  });

  it('numbers steps starting at 1 and emits step anchors', () => {
    const blob = buildHowToBlob(ctx, {
      url: 'https://cleanstart.com/guide/x',
      title: 'X',
      steps: [
        { heading: 'A', body: 'a body' },
        { heading: 'B', body: 'b body' },
        { heading: 'C', body: 'c body' },
      ],
    }) as unknown as { step: { '@id': string; position: number }[] };
    expect(blob.step.map((s) => s.position)).toEqual([1, 2, 3]);
    expect(blob.step[0]?.['@id']).toBe('https://cleanstart.com/guide/x#step-1');
    expect(blob.step[2]?.['@id']).toBe('https://cleanstart.com/guide/x#step-3');
  });
});
