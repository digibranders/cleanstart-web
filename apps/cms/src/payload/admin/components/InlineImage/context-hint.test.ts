import { describe, expect, it } from 'vitest';

import { buildInlineMediaContextHint } from './context-hint';

describe('buildInlineMediaContextHint', () => {
  it('slugifies the title and appends -inline, without a collection prefix', () => {
    expect(buildInlineMediaContextHint('Getting Started with SBOM', 42)).toBe(
      'getting-started-with-sbom-inline',
    );
  });

  it('falls back to the doc id when the title is empty', () => {
    expect(buildInlineMediaContextHint('', 42)).toBe('42-inline');
    expect(buildInlineMediaContextHint(null, '17')).toBe('17-inline');
  });

  it('falls back to "untitled" when neither title nor id is available', () => {
    expect(buildInlineMediaContextHint(null, null)).toBe('untitled-inline');
    expect(buildInlineMediaContextHint(undefined, undefined)).toBe('untitled-inline');
  });
});
