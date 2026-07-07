import { describe, expect, it } from 'vitest';

import { POST_LAUNCH_REDIRECTS_SEED, assertRedirectSeedValid } from './post-launch-redirects-seed';

describe('POST_LAUNCH_REDIRECTS_SEED', () => {
  it('contains the 3 GSC-audit redirect fixes', () => {
    expect(POST_LAUNCH_REDIRECTS_SEED).toHaveLength(3);
  });

  it('passes the invariant guard (unique froms, valid shapes, all 301)', () => {
    expect(() => assertRedirectSeedValid(POST_LAUNCH_REDIRECTS_SEED)).not.toThrow();
  });

  it('has unique `from` paths', () => {
    const froms = POST_LAUNCH_REDIRECTS_SEED.map((r) => r.from);
    expect(new Set(froms).size).toBe(froms.length);
  });

  it('every `to` is a site-relative path', () => {
    for (const r of POST_LAUNCH_REDIRECTS_SEED) {
      expect(r.to.startsWith('/')).toBe(true);
    }
  });

  it('redirects the deleted SCA page to its live guide equivalent', () => {
    const sca = POST_LAUNCH_REDIRECTS_SEED.find((r) => r.from === '/software-composition-analysis');
    expect(sca?.to).toBe('/guide/software-composition-analysis');
  });
});
