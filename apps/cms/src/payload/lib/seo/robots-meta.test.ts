import { describe, expect, it } from 'vitest';

import { composeRobotsMeta } from './robots-meta';

describe('composeRobotsMeta', () => {
  it('defaults to index, follow', () => {
    expect(composeRobotsMeta({})).toBe('index, follow');
  });

  it('honours noindex', () => {
    expect(composeRobotsMeta({ indexable: 'noindex' })).toBe('noindex, follow');
  });

  it('honours noindex, nofollow', () => {
    expect(composeRobotsMeta({ indexable: 'noindex,nofollow' })).toBe('noindex, nofollow');
  });

  it('appends boolean directives', () => {
    expect(
      composeRobotsMeta({
        advanced: { noarchive: true, nosnippet: true, noimageindex: true, notranslate: true },
      }),
    ).toBe('index, follow, noarchive, nosnippet, noimageindex, notranslate');
  });

  it('emits max-snippet:-1 (no limit)', () => {
    expect(composeRobotsMeta({ advanced: { maxSnippet: -1 } })).toBe('index, follow, max-snippet:-1');
  });

  it('emits max-snippet:N for any positive', () => {
    expect(composeRobotsMeta({ advanced: { maxSnippet: 320 } })).toBe(
      'index, follow, max-snippet:320',
    );
  });

  it('emits max-image-preview:large', () => {
    expect(composeRobotsMeta({ advanced: { maxImagePreview: 'large' } })).toBe(
      'index, follow, max-image-preview:large',
    );
  });

  it('does NOT emit max-image-preview:standard (it is the default)', () => {
    expect(composeRobotsMeta({ advanced: { maxImagePreview: 'standard' } })).toBe(
      'index, follow',
    );
  });

  it('emits max-image-preview:none', () => {
    expect(composeRobotsMeta({ advanced: { maxImagePreview: 'none' } })).toBe(
      'index, follow, max-image-preview:none',
    );
  });

  it('emits max-video-preview', () => {
    expect(composeRobotsMeta({ advanced: { maxVideoPreview: 30 } })).toBe(
      'index, follow, max-video-preview:30',
    );
  });

  it('emits unavailable_after as ISO 8601', () => {
    const out = composeRobotsMeta({ advanced: { unavailableAfter: '2026-12-31' } });
    expect(out).toMatch(/index, follow, unavailable_after: \d{4}-\d{2}-\d{2}T/);
  });

  it('drops invalid unavailable_after silently', () => {
    expect(composeRobotsMeta({ advanced: { unavailableAfter: 'not-a-date' } })).toBe(
      'index, follow',
    );
  });

  it('composes everything together', () => {
    expect(
      composeRobotsMeta({
        indexable: 'noindex',
        advanced: {
          noarchive: true,
          maxSnippet: -1,
          maxImagePreview: 'large',
          maxVideoPreview: 30,
        },
      }),
    ).toBe('noindex, follow, noarchive, max-snippet:-1, max-image-preview:large, max-video-preview:30');
  });

  it('treats nullish advanced as no-op', () => {
    expect(composeRobotsMeta({ advanced: null })).toBe('index, follow');
  });
});
