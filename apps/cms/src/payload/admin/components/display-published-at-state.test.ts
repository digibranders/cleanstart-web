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
  describe('empty / unparseable', () => {
    it('returns `empty` for null / undefined / empty string', () => {
      expect(resolveDisplayPublishedAtState(null, null, 'draft', NOW)).toEqual({ kind: 'empty' });
      expect(resolveDisplayPublishedAtState(undefined, null, 'draft', NOW)).toEqual({ kind: 'empty' });
      expect(resolveDisplayPublishedAtState('', null, 'draft', NOW)).toEqual({ kind: 'empty' });
    });

    it('returns `empty` for unparseable strings (defensive)', () => {
      expect(resolveDisplayPublishedAtState('not-a-date', null, 'draft', NOW)).toEqual({
        kind: 'empty',
      });
    });
  });

  describe('unchanged (the original bug fix — opening an existing post)', () => {
    it('stays silent on an 8-month-old published post the editor has not touched', () => {
      const eightMonthsAgo = ISO(NOW - 240 * DAY);
      expect(
        resolveDisplayPublishedAtState(eightMonthsAgo, eightMonthsAgo, 'published', NOW),
      ).toEqual({ kind: 'unchanged' });
    });

    it('stays silent on a freshly-set future value the editor has not re-touched', () => {
      const tomorrow = ISO(NOW + 1 * DAY);
      expect(resolveDisplayPublishedAtState(tomorrow, tomorrow, 'draft', NOW)).toEqual({
        kind: 'unchanged',
      });
    });
  });

  describe('near-now (small adjustments)', () => {
    it('treats values within ±24h of now as near-now on new drafts (no initial)', () => {
      expect(resolveDisplayPublishedAtState(ISO(NOW), null, 'draft', NOW)).toEqual({
        kind: 'near-now',
      });
      expect(
        resolveDisplayPublishedAtState(ISO(NOW - 23 * HOUR), null, 'published', NOW),
      ).toEqual({ kind: 'near-now' });
    });

    it('1-day typo cleanup on an existing 8-month-old post stays near-now', () => {
      const eightMonthsAgo = ISO(NOW - 240 * DAY);
      const oneDayEarlier = ISO(NOW - 241 * DAY);
      expect(
        resolveDisplayPublishedAtState(oneDayEarlier, eightMonthsAgo, 'published', NOW),
      ).toEqual({ kind: 'near-now' });
    });

    it('moving the date FORWARD (un-backdating) never warns', () => {
      const oneYearAgo = ISO(NOW - 365 * DAY);
      const sixMonthsAgo = ISO(NOW - 180 * DAY);
      expect(
        resolveDisplayPublishedAtState(sixMonthsAgo, oneYearAgo, 'published', NOW),
      ).toEqual({ kind: 'near-now' });
    });
  });

  describe('backdate-soft (editor moved date earlier within 30 days)', () => {
    it('new draft, declared date 10 days ago', () => {
      const result = resolveDisplayPublishedAtState(ISO(NOW - 10 * DAY), null, 'draft', NOW);
      expect(result.kind).toBe('backdate-soft');
      if (result.kind === 'backdate-soft') expect(result.days).toBe(10);
    });

    it('existing post moved 10 days earlier than saved value', () => {
      const saved = ISO(NOW - 200 * DAY);
      const moved = ISO(NOW - 210 * DAY);
      const result = resolveDisplayPublishedAtState(moved, saved, 'published', NOW);
      expect(result.kind).toBe('backdate-soft');
      if (result.kind === 'backdate-soft') expect(result.days).toBe(10);
    });

    it('boundary: exactly 30 days earlier than baseline stays soft', () => {
      const result = resolveDisplayPublishedAtState(ISO(NOW - 30 * DAY), null, 'published', NOW);
      expect(result.kind).toBe('backdate-soft');
      if (result.kind === 'backdate-soft') expect(result.days).toBe(30);
    });
  });

  describe('backdate-hard (>30 days backward — Google spam-policy zone)', () => {
    it('new draft, declared date 90 days ago', () => {
      const result = resolveDisplayPublishedAtState(ISO(NOW - 90 * DAY), null, 'draft', NOW);
      expect(result.kind).toBe('backdate-hard');
      if (result.kind === 'backdate-hard') expect(result.days).toBe(90);
    });

    it('existing post moved 90 days earlier than saved value', () => {
      const saved = ISO(NOW - 30 * DAY);
      const moved = ISO(NOW - 120 * DAY);
      const result = resolveDisplayPublishedAtState(moved, saved, 'published', NOW);
      expect(result.kind).toBe('backdate-hard');
      if (result.kind === 'backdate-hard') expect(result.days).toBe(90);
    });

    it('hard threshold constant is 30 days', () => {
      expect(PICKER_HARD_WARN_DAYS).toBe(30);
    });
  });

  describe('future', () => {
    it('returns `future-draft` for tomorrow-or-later on a draft', () => {
      expect(resolveDisplayPublishedAtState(ISO(NOW + 3 * DAY), null, 'draft', NOW)).toEqual({
        kind: 'future-draft',
      });
      expect(
        resolveDisplayPublishedAtState(ISO(NOW + 3 * DAY), null, undefined, NOW),
      ).toEqual({ kind: 'future-draft' });
    });

    it('returns `future-published` for future values on already-published docs', () => {
      expect(
        resolveDisplayPublishedAtState(ISO(NOW + 3 * DAY), null, 'published', NOW),
      ).toEqual({ kind: 'future-published' });
    });

    it('values within +24h of now stay near-now (not future), regardless of status', () => {
      expect(
        resolveDisplayPublishedAtState(
          ISO(NOW + PICKER_NEAR_NOW_HOURS * HOUR),
          null,
          'draft',
          NOW,
        ),
      ).toEqual({ kind: 'near-now' });
    });
  });
});
