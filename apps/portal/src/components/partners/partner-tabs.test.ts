import { describe, expect, it } from 'vitest';
import { partnerTabs } from './partner-tabs';

describe('partnerTabs', () => {
  it('lists the Applications tab only for a viewer who can read applications', () => {
    expect(partnerTabs(15, 3, true)).toEqual([
      ['Partners', 15],
      ['Applications', 3],
    ]);
    expect(partnerTabs(15, 0, false)).toEqual([['Partners', 15]]);
  });
});
