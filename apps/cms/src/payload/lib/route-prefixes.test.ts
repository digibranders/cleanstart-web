import { describe, expect, it } from 'vitest';

import {
  ROUTE_PREFIX,
  collectionUrlFromDoc,
  collectionUrlFromSlug,
  listingPathForCollection,
} from './route-prefixes';

describe('collectionUrlFromSlug / collectionUrlFromDoc (detail URLs)', () => {
  it('composes the detail URL from the (singular) detail prefix', () => {
    expect(collectionUrlFromSlug('resources', 'x')).toBe('/resources/x');
    expect(collectionUrlFromSlug('jobs', 'x')).toBe('/job/x');
    expect(collectionUrlFromDoc('events', { slug: 'x' })).toBe('/event/x');
  });

  it('returns null for unknown collections / missing slugs', () => {
    expect(collectionUrlFromSlug('nope', 'x')).toBeNull();
    expect(collectionUrlFromDoc('resources', { slug: '' })).toBeNull();
  });
});

describe('listingPathForCollection (index URLs for revalidation)', () => {
  it('overrides collections whose listing route differs from the detail prefix', () => {
    // These differ from ROUTE_PREFIX; revalidating the prefix would purge a
    // 301 redirect, never the real listing.
    expect(listingPathForCollection('resources')).toBe('/resource-center');
    expect(listingPathForCollection('events')).toBe('/events');
    expect(listingPathForCollection('webinars')).toBe('/webinars');
    expect(listingPathForCollection('jobs')).toBe('/careers');
  });

  it('falls back to ROUTE_PREFIX when the listing matches the detail prefix', () => {
    expect(listingPathForCollection('blogs')).toBe(ROUTE_PREFIX.blogs);
    expect(listingPathForCollection('news')).toBe(ROUTE_PREFIX.news);
  });

  it('returns null for unknown collections', () => {
    expect(listingPathForCollection('nope')).toBeNull();
  });
});
