import { describe, expect, it } from 'vitest';

import { buildSpeakable, imageObjectFromMedia, onlyResolved, pickResolved } from './shared';

describe('imageObjectFromMedia', () => {
  it('returns null when media is missing or has no URL', () => {
    expect(imageObjectFromMedia(null)).toBeNull();
    expect(imageObjectFromMedia(undefined)).toBeNull();
    expect(imageObjectFromMedia({})).toBeNull();
    expect(imageObjectFromMedia({ url: '' })).toBeNull();
  });

  it('emits ImageObject with width/height/caption when provided', () => {
    expect(
      imageObjectFromMedia({ url: 'https://cdn.example/x.png', width: 1200, height: 630, alt: 'X' }),
    ).toEqual({
      '@type': 'ImageObject',
      url: 'https://cdn.example/x.png',
      width: 1200,
      height: 630,
      caption: 'X',
    });
  });

  it('omits dimensions / caption when not provided', () => {
    expect(imageObjectFromMedia({ url: 'https://cdn.example/x.png' })).toEqual({
      '@type': 'ImageObject',
      url: 'https://cdn.example/x.png',
    });
  });
});

describe('pickResolved', () => {
  it('returns the first resolved object in the list', () => {
    expect(pickResolved([{ name: 'a' }, { name: 'b' }])).toEqual({ name: 'a' });
  });

  it('returns null for empty / null / number-only lists', () => {
    expect(pickResolved([])).toBeNull();
    expect(pickResolved(null)).toBeNull();
    expect(pickResolved([1, 2, 3])).toBeNull();
  });

  it('skips a leading number ID and returns null (does not search past it)', () => {
    // Conservative: if the first entry is unresolved, skip the whole list to
    // avoid emitting a partial / misleading "primary" entity.
    expect(pickResolved([1, { name: 'b' }])).toBeNull();
  });
});

describe('onlyResolved', () => {
  it('keeps objects, drops numbers and null/undefined', () => {
    expect(onlyResolved([1, { id: 'a' }, null, { id: 'b' }, undefined])).toEqual([
      { id: 'a' },
      { id: 'b' },
    ]);
  });

  it('returns [] for null / empty input', () => {
    expect(onlyResolved(null)).toEqual([]);
    expect(onlyResolved([])).toEqual([]);
  });
});

describe('buildSpeakable', () => {
  it('uses default selectors when none are provided', () => {
    expect(buildSpeakable(null)).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['.lead', 'article p:first-of-type'],
    });
  });

  it('uses editor-supplied selectors when set', () => {
    expect(buildSpeakable([{ selector: '.tldr' }, { selector: 'h2' }, { selector: '' }])).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['.tldr', 'h2'],
    });
  });

  it('falls back to defaults when all editor entries are blank', () => {
    expect(buildSpeakable([{ selector: '' }, { selector: null }])).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['.lead', 'article p:first-of-type'],
    });
  });
});
