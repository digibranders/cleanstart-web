import { cache } from 'react';
import { type RegionDto, regionName } from '@/lib/regions';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem } from '@/server/repo/context';
import { listRegions } from '@/server/repo/regions';

/**
 * The regions table, read once per request, for text built outside a screen: emails, PDFs, CSVs, audit lines and anything
 * else that names a region with no transaction at hand. The list is readable by every signed in user and the system.
 * Code that already holds a transaction should call listRegions(tx) instead.
 */
export const loadRegionList = cache((): Promise<RegionDto[]> => withSystem(SYSTEM_ACTORS.portal, (tx) => listRegions(tx)));

/** The current display name of a region key, from the table. A key that is not there becomes a title cased key. */
export async function regionNameOf(key: string): Promise<string> {
  return regionName(key, await loadRegionList());
}
