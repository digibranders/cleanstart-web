import { describe, expect, it } from 'vitest';

import {
  PICKER_HARD_WARN_DAYS,
  PICKER_NEAR_NOW_HOURS,
  resolveDisplayPublishedAtState,
} from './display-published-at-state';

const NOW = new Date('2026-06-15T12:00:00Z').getTime();
const ISO = (ms: number) => new Date(ms).toISOString();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe('resolveDisplayPublishedAtState', () => {
  it('returns `empty` for null / undefined / empty string', () => {
    expect(resolveDisplayPublishedAtState(null, 'draft', NOW)).toEqual({ kind: 'empty' });
    expect(resolveDisplayPublishedAtState(undefined, 'draft', NOW)).toEqual({ kind: 'empty' });
    expect(resolveDisplayPublishedAtState('', 'draft', NOW)).toEqual({ kind: 'empty' });
  });

  it('returns `empty` for unparseable strings (defensive)', () => {
    expect(resolveDisplayPublishedAtState('not-a-date', 'draft', NOW)).toEqual({ kind: 'empty' });
  });

  it('returns `near-now` within ±24h of now', () => {
    expect(resolveDisplayPublishedAtState(ISO(NOW), 'draft', NOW)).toEqual({ kind: 'near-now' });
    expect(
      resolveDisplayPublishedAtState(ISO(NOW - 23 * HOUR), 'published', NOW),
    ).toEqual({ kind: 'near-now' });
    expect(
      resolveDisplayPublishedAtState(ISO(NOW + 23 * HOUR), 'draft', NOW),
    ).toEqual({ kind: 'near-now' });
    // Boundary: exactly 24h is still near-now (inclusive)
    expect(
      resolveDisplayPublishedAtState(ISO(NOW - PICKER_NEAR_NOW_HOURS * HOUR), 'published', NOW),
    ).toEqual({ kind: 'near-now' });
  });

  it('returns `backdate-soft` for past values within 30 days', () => {
    const result = resolveDisplayPublishedAtState(ISO(NOW - 10 * DAY), 'published', NOW);
    expect(result.kind).toBe('backdate-soft');
    expect(result.kind === 'backdate-soft' && result.days).toBe(10);
  });

  it('returns `backdate-soft` at exactly the boundary (30 days)', () => {
    const result = resolveDisplayPublishedAtState(ISO(NOW - 30 * DAY), 'published', NOW);
    expect(result.kind).toBe('backdate-soft');
    expect(result.kind === 'backdate-soft' && result.days).toBe(30);
  });

  it('returns `backdate-hard` past the 30-day spam-policy boundary', () => {
    const result = resolveDisplayPublishedAtState(ISO(NOW - 90 * DAY), 'published', NOW);
    expect(result.kind).toBe('backdate-hard');
    expect(result.kind === 'backdate-hard' && result.days).toBe(90);
    expect(PICKER_HARD_WARN_DAYS).toBe(30);
  });

  it('returns `future-draft` for future values when status is draft / null', () => {
    expect(
      resolveDisplayPublishedAtState(ISO(NOW + 3 * DAY), 'draft', NOW),
    ).toEqual({ kind: 'future-draft' });
    expect(
      resolveDisplayPublishedAtState(ISO(NOW + 3 * DAY), null, NOW),
    ).toEqual({ kind: 'future-draft' });
    expect(
      resolveDisplayPublishedAtState(ISO(NOW + 3 * DAY), undefined, NOW),
    ).toEqual({ kind: 'future-draft' });
  });

  it('returns `future-published` for future values when status is published', () => {
    expect(
      resolveDisplayPublishedAtState(ISO(NOW + 3 * DAY), 'published', NOW),
    ).toEqual({ kind: 'future-published' });
  });
});
