"use client";

import { createContext, useContext, useMemo } from "react";
import { offerableRegions, type RegionDto, regionName } from "@/lib/regions";

const RegionsContext = createContext<readonly RegionDto[]>([]);

/** The regions table for every screen under a layout, so a dropdown or a label never carries its own list. */
export function RegionsProvider({ regions, children }: { regions: readonly RegionDto[]; children: React.ReactNode }): React.JSX.Element {
  return <RegionsContext.Provider value={regions}>{children}</RegionsContext.Provider>;
}

export interface RegionTools {
  regions: readonly RegionDto[];
  /** The display name of a key. Unknown keys fall back to a readable name. */
  name: (key: string) => string;
  /** Regions to offer for a new choice: the active ones, plus `current` when a record already holds an inactive one. */
  offer: (current?: string | null) => RegionDto[];
}

export function useRegions(): RegionTools {
  const regions = useContext(RegionsContext);
  return useMemo(() => ({ regions, name: (key) => regionName(key, regions), offer: (current) => offerableRegions(regions, current) }), [regions]);
}

/** The display name of a region key, for JSX. */
export function RegionName({ k }: { k: string }): React.JSX.Element {
  return <>{useRegions().name(k)}</>;
}
