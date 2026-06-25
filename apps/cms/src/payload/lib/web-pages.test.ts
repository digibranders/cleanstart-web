import { describe, expect, it } from 'vitest';

import {
  PURGEABLE_COLLECTIONS,
  isPurgeableCollection,
  purgePathsForDoc,
} from './web-pages';

describe('isPurgeableCollection', () => {
  it('includes every web-facing collection', () => {
    for (const c of [
      'blogs',
      'news',
      'guides',
      'resources',
      'events',
      'jobs',
      'knowledgeBase',
      'legalDocuments',
      'authors',
      'case-studies',
      'webinars',
      'podcastEpisodes',
    ]) {
      expect(isPurgeableCollection(c)).toBe(true);
    }
    expect(Object.keys(PURGEABLE_COLLECTIONS)).toHaveLength(12);
  });

  it('excludes collections with no live web route', () => {
    for (const c of ['categories', 'newsCategories', 'knowledgeCategories', 'pages', 'media']) {
      expect(isPurgeableCollection(c)).toBe(false);
    }
  });
});

describe('purgePathsForDoc', () => {
  it('returns listing + detail for a full collection', () => {
    expect(purgePathsForDoc('news', { slug: 'hello' })).toEqual(['/news', '/news/hello']);
  });

  it('honours the listing override (detail prefix ≠ listing)', () => {
    expect(purgePathsForDoc('resources', { slug: 'x' })).toEqual(['/resource-center', '/resources/x']);
    expect(purgePathsForDoc('jobs', { slug: 'x' })).toEqual(['/careers', '/job/x']);
    expect(purgePathsForDoc('events', { slug: 'x' })).toEqual(['/events', '/event/x']);
  });

  it('returns detail only for authors (no listing route)', () => {
    expect(purgePathsForDoc('authors', { slug: 'jane' })).toEqual(['/author/jane']);
  });

  it('returns listing only for listing-only collections (no dead detail path)', () => {
    expect(purgePathsForDoc('webinars', { slug: 'x' })).toEqual(['/webinars']);
    expect(purgePathsForDoc('case-studies', { slug: 'x' })).toEqual(['/case-studies']);
    expect(purgePathsForDoc('podcastEpisodes', { slug: 'x' })).toEqual(['/podcast']);
  });

  it('omits the detail path when slug is missing', () => {
    expect(purgePathsForDoc('news', {})).toEqual(['/news']);
    expect(purgePathsForDoc('authors', { slug: null })).toEqual([]);
  });

  it('returns [] for an unknown collection', () => {
    expect(purgePathsForDoc('media', { slug: 'x' })).toEqual([]);
  });
});
