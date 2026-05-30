import { cache } from 'react';

export const CAREERS_TAG = 'careers-open-count';

/**
 * Returns the count of currently open careers/roles.
 *
 * TODO: Wire to a real Payload `careers` collection fetcher once that
 * collection ships. Until then this returns 0, which is the correct
 * fallback: when openRoles is 0 the spotlight priority chain falls
 * through to the CMS spotlight or the Talent Network evergreen card,
 * both of which are valid renderings.
 */
export const fetchOpenRolesCount = cache(async (): Promise<number> => {
  return 0;
});
