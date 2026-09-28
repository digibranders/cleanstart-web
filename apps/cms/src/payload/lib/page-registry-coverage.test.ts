import { describe, expect, it } from 'vitest';

import {
  INTENTIONALLY_UNREGISTERED,
  diffPageRegistryCoverage,
  routeFromPageFile,
} from './page-registry-coverage';

describe('routeFromPageFile', () => {
  it('maps the root page to /', () => {
    expect(routeFromPageFile('page.tsx')).toBe('/');
  });

  it('maps a nested static page', () => {
    expect(routeFromPageFile('fips/page.tsx')).toBe('/fips');
  });

  it('preserves dynamic segments literally, matching cms-template seed rows', () => {
    expect(routeFromPageFile('blogs/[slug]/page.tsx')).toBe('/blogs/[slug]');
  });

  it('strips route-group segments — they never appear in the URL', () => {
    expect(routeFromPageFile('(legal)/legal/[slug]/page.tsx')).toBe('/legal/[slug]');
    expect(routeFromPageFile('(legal)/privacy-policy/page.tsx')).toBe('/privacy-policy');
  });

  it('handles a deeply nested static page', () => {
    expect(routeFromPageFile('industries/financial-services/page.tsx')).toBe(
      '/industries/financial-services',
    );
  });
});

describe('diffPageRegistryCoverage', () => {
  it('reports no drift when every route has a row and every row has a route', () => {
    const result = diffPageRegistryCoverage(['/fips', '/blogs/[slug]'], ['/fips', '/blogs/[slug]']);
    expect(result).toEqual({ missing: [], orphaned: [] });
  });

  it('flags a route with no seed row as missing', () => {
    const result = diffPageRegistryCoverage(['/fips', '/new-page'], ['/fips']);
    expect(result.missing).toEqual(['/new-page']);
  });

  it('flags a seed row with no matching route as orphaned, not missing', () => {
    const result = diffPageRegistryCoverage(['/fips'], ['/fips', '/deleted-page']);
    expect(result.orphaned).toEqual(['/deleted-page']);
    expect(result.missing).toEqual([]);
  });

  it('excludes intentionally-unregistered routes from missing', () => {
    const result = diffPageRegistryCoverage(['/fips', '/email-signatures'], ['/fips']);
    expect(result.missing).toEqual([]);
  });

  it('does not exclude an intentionally-unregistered path from the orphaned check', () => {
    // Sanity: the exclusion set only suppresses false positives on the web
    // side. A seed row is never auto-excluded just because its path also
    // happens to be in that set (nothing in the real seed should ever be).
    const result = diffPageRegistryCoverage(
      ['/fips'],
      ['/fips', '/email-signatures'],
      INTENTIONALLY_UNREGISTERED,
    );
    expect(result.orphaned).toEqual(['/email-signatures']);
  });

  it('sorts both lists for stable output', () => {
    const result = diffPageRegistryCoverage(['/zebra', '/apple'], []);
    expect(result.missing).toEqual(['/apple', '/zebra']);
  });

  it('accepts a custom exclusion set', () => {
    const result = diffPageRegistryCoverage(['/internal-tool'], [], new Set(['/internal-tool']));
    expect(result.missing).toEqual([]);
  });
});
