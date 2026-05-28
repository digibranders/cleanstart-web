import { describe, expect, it } from 'vitest';
import { LOGO_POOL, getCveSummaryFor, getLogoForCube } from './logoPool';

describe('logoPool', () => {
  it('exposes exactly the 10 curated logos', () => {
    expect(LOGO_POOL).toHaveLength(10);
    expect(LOGO_POOL).toContain('nginx');
    expect(LOGO_POOL).toContain('postgres');
  });

  it('round-robin is deterministic for a given seed', () => {
    expect(getLogoForCube(0)).toBe(getLogoForCube(0));
    expect(getLogoForCube(0)).not.toBe(getLogoForCube(1));
  });

  it('round-robin wraps the pool', () => {
    expect(getLogoForCube(0)).toBe(getLogoForCube(LOGO_POOL.length));
  });

  it('every logo in the pool has a CVE summary', () => {
    for (const slug of LOGO_POOL) {
      const summary = getCveSummaryFor(slug);
      expect(summary.cveCount).toBeGreaterThan(0);
      expect(summary.version).toMatch(/^v\d/);
      expect(summary.depCount).toBeGreaterThan(0);
    }
  });

  it('returns a stable fallback for unknown slugs (should never happen)', () => {
    const s = getCveSummaryFor('this-does-not-exist' as never);
    expect(s.cveCount).toBeGreaterThanOrEqual(1);
  });
});
