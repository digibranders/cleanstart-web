import { describe, expect, it } from 'vitest';

import { scoreSeoHealth } from './health-score';

const baseInputs = {
  title: 'A solid title that lives well within sixty characters.',
  description:
    'A description that is long enough to clear the fifty character minimum but stays under one-seventy total.',
  indexable: 'index',
  hasOgImage: true,
  hasHero: true,
  slugOrPath: '/blogs/example',
};

describe('scoreSeoHealth', () => {
  it('returns 100 / healthy when every check passes', () => {
    const result = scoreSeoHealth(baseInputs);
    expect(result.score).toBe(100);
    expect(result.band).toBe('healthy');
    expect(result.failingCount).toBe(0);
  });

  it('flags noindex docs and drops them out of the healthy band', () => {
    const result = scoreSeoHealth({ ...baseInputs, indexable: 'noindex' });
    expect(result.checks.find((c) => c.id === 'indexable')?.pass).toBe(false);
    expect(result.score).toBeLessThan(100);
  });

  it('flags missing title + description as missing-essentials', () => {
    const result = scoreSeoHealth({
      ...baseInputs,
      title: null,
      description: null,
    });
    expect(result.failingCount).toBeGreaterThanOrEqual(4);
    expect(result.band).toBe('missing');
  });

  it('flags an over-long title', () => {
    const result = scoreSeoHealth({
      ...baseInputs,
      title: 'a'.repeat(80),
    });
    expect(result.checks.find((c) => c.id === 'title-length')?.pass).toBe(false);
    // title-set still passes (non-empty), so we don't drop into `missing`.
    expect(result.band).not.toBe('missing');
  });

  it('passes when only one of OG image / hero is set', () => {
    const result = scoreSeoHealth({ ...baseInputs, hasOgImage: false });
    expect(result.checks.find((c) => c.id === 'social-image')?.pass).toBe(true);
  });

  it('flags a slug longer than the cap', () => {
    const result = scoreSeoHealth({
      ...baseInputs,
      slugOrPath: `/${'x'.repeat(80)}`,
    });
    // slug-length now carries weight 2 and implicitly covers "URL is set".
    // The separate url-set check was removed to avoid double-counting.
    expect(result.checks.find((c) => c.id === 'slug-length')?.pass).toBe(false);
    expect(result.checks.find((c) => c.id === 'url-set')).toBeUndefined();
  });

  it('treats empty indexable as indexable (default behavior)', () => {
    const result = scoreSeoHealth({ ...baseInputs, indexable: null });
    expect(result.checks.find((c) => c.id === 'indexable')?.pass).toBe(true);
  });
});
