import { cache } from "react";
import { fetchCMS } from "./cms-fetch";

export type ImpactStat = {
  value: string;
  label: string;
};

type ImpactStatsGlobal = {
  stats?: ImpactStat[] | null;
};

/**
 * Canonical impact metrics, also rendered by the Images catalog hero. Used as
 * the fallback when the CMS global is empty or unreachable so the stats band
 * never disappears.
 */
export const IMPACT_STATS_FALLBACK: ImpactStat[] = [
  { value: "88,000+", label: "CVEs remediated" },
  { value: "90%+", label: "Average CVE reduction" },
  { value: "300,000+", label: "Engineering hours saved" },
  { value: "10M+", label: "Packages from verified source" },
];

/**
 * Fetch the editable impact stats from the `impactStats` Payload global.
 * Returns the fallback set on any error or when the global has no rows, so
 * callers can render unconditionally.
 */
export const getImpactStats = cache(async (): Promise<ImpactStat[]> => {
  try {
    const data = await fetchCMS<ImpactStatsGlobal>("/api/globals/impactStats");
    const stats = data.stats?.filter((s) => s?.value && s?.label) ?? [];
    return stats.length > 0 ? stats : IMPACT_STATS_FALLBACK;
  } catch {
    return IMPACT_STATS_FALLBACK;
  }
});
