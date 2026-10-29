import { describe, expect, it } from 'vitest';

import { formatSeconds, videoLength, videoState } from './video-state';

describe('videoState', () => {
  it('calls a published video live', () => {
    expect(videoState({ _status: 'published', syncState: 'synced' })).toEqual({ label: 'Live', tone: 'live' });
  });

  it('marks a fresh import as needing review', () => {
    expect(videoState({ _status: 'draft', syncState: 'needs-review' }).label).toBe('Needs review');
  });

  it('calls any other draft a draft', () => {
    expect(videoState({ _status: 'draft', syncState: 'manual' })).toEqual({ label: 'Draft', tone: 'draft' });
  });

  it.each([
    [{ syncState: 'missing' }, 'Missing on YouTube'],
    [{ source: { privacyStatus: 'private' } }, 'Private on YouTube'],
    [{ source: { embeddable: false } }, "Can't be embedded"],
  ])('flags %j as a problem even when the video is live', (extra, label) => {
    expect(videoState({ _status: 'published', ...extra })).toEqual({ label, tone: 'problem' });
  });

  it('treats an unlisted video as fine, because it still embeds', () => {
    expect(videoState({ _status: 'published', source: { privacyStatus: 'unlisted', embeddable: true } }).tone).toBe('live');
  });
});

describe('videoLength', () => {
  it('formats the length YouTube reported', () => {
    expect(formatSeconds(101)).toBe('1:41');
    expect(formatSeconds(3730)).toBe('1:02:10');
    expect(videoLength({ source: { durationSeconds: 138 } })).toBe('2:18');
  });

  it('prefers the YouTube length over a typed one', () => {
    expect(videoLength({ source: { durationSeconds: 101 }, durationLabel: '9:99' })).toBe('1:41');
  });

  it('falls back to the typed length, then to nothing', () => {
    expect(videoLength({ source: { durationSeconds: null }, durationLabel: ' 2:08 ' })).toBe('2:08');
    expect(videoLength({})).toBeNull();
  });
});
