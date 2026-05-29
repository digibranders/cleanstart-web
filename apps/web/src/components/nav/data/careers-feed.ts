import { cache } from 'react';

export const CAREERS_TAG = 'careers-open-count';

/**
 * Returns the count of currently open careers/roles.
 *
 * TODO: Wire to a real Payload `careers` collection fetcher once that
 * collection ships. Until then this returns 0 — which is correct per
 * the spotlight priority chain spec (§3 D11): when openRoles === 0,
 * the chain falls through to State 2 (CMS spotlight) or State 3
 * (Talent Network evergreen), both of which are valid renderings.
 */
export const fetchOpenRolesCount = cache(async (): Promise<number> => {
  return 0;
});
