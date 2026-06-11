import { describe, expect, it } from 'vitest';

import { REDIRECTS_SEED, type RedirectSeed, assertRedirectSeedValid } from './redirects-seed';

describe('REDIRECTS_SEED', () => {
  it('contains the full 26-row Webflow redirect map', () => {
    expect(REDIRECTS_SEED).toHaveLength(26);
  });

  it('passes the invariant guard (unique froms, valid shapes, all 301)', () => {
    expect(() => assertRedirectSeedValid()).not.toThrow();
  });

  it('has unique `from` paths', () => {
    const froms = REDIRECTS_SEED.map((r) => r.from);
    expect(new Set(froms).size).toBe(froms.length);
  });

  it('every `to` is a site-relative path or an https URL', () => {
    for (const r of REDIRECTS_SEED) {
      expect(r.to.startsWith('/') || r.to.startsWith('https://')).toBe(true);
    }
  });

  it('records `originalTarget` on every remapped row (and only those)', () => {
    const remapped = REDIRECTS_SEED.filter((r) => r.originalTarget);
    expect(remapped.map((r) => r.from).sort()).toEqual(
      ['/cleansight-campaign', '/cleanstart-hitachi', '/cleanstart-survey', '/new-year-event'].sort(),
    );
    // A remapped row's live target must differ from its dead Webflow target.
    for (const r of remapped) expect(r.to).not.toBe(r.originalTarget);
  });

  it('remaps every dead target to a live route, not back to a dead one', () => {
    const deadTargets = new Set(
      REDIRECTS_SEED.flatMap((r) => (r.originalTarget ? [r.originalTarget] : [])),
    );
    for (const r of REDIRECTS_SEED) {
      if (r.to.startsWith('/')) expect(deadTargets.has(r.to)).toBe(false);
    }
  });
});

describe('assertRedirectSeedValid', () => {
  const ok: RedirectSeed = { from: '/a', to: '/b', status: '301' };

  it('throws on a duplicate `from`', () => {
    expect(() => assertRedirectSeedValid([ok, { ...ok, to: '/c' }])).toThrow(/Duplicate/);
  });

  it('throws on a malformed path', () => {
    expect(() => assertRedirectSeedValid([{ from: 'no-leading-slash', to: '/b', status: '301' }])).toThrow(
      /Invalid redirect 'from'/,
    );
  });

  it('throws on a non-301 status', () => {
    expect(() =>
      // @ts-expect-error deliberately wrong status for the guard test
      assertRedirectSeedValid([{ from: '/a', to: '/b', status: '302' }]),
    ).toThrow(/non-301/);
  });
});
