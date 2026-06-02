import { cache } from "react";
import { fetchOpenRoles } from "./open-roles";

export const CAREERS_TAG = "careers-open-count";

/**
 * Count of currently open roles, derived from the live open-roles list.
 * Fail-soft via `fetchOpenRoles` (returns [] on CMS error → count 0), which
 * correctly falls the spotlight priority chain through to the CMS/community
 * card instead of advertising a "0 open roles" state.
 */
export const fetchOpenRolesCount = cache(async (): Promise<number> => {
  return (await fetchOpenRoles()).length;
});
