"use client";

import { useSearchParams } from "next/navigation";
import {
  WebinarsContent,
  selectWebinars,
} from "@/components/sections/webinars/WebinarsContent";
import type { Webinar } from "@/lib/webinars";
import { parseRegionParam, parseTypeParam } from "@/lib/webinars-utils";

interface WebinarsBrowserProps {
  allWebinars: Webinar[];
  loadFailed?: boolean;
}

/**
 * Client driver for the /webinars listing — reads the type/region/page filters
 * from the URL and filters the full set in memory so the route stays static.
 * Must be wrapped in `<Suspense>` by the page. See `BlogsBrowser.tsx`.
 */
export function WebinarsBrowser({
  allWebinars,
  loadFailed = false,
}: WebinarsBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const activeType = parseTypeParam(params.get("type") ?? undefined);
  const activeRegion = parseRegionParam(params.get("region") ?? undefined);
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const { items, totalPages } = selectWebinars(allWebinars, {
    type: activeType,
    region: activeRegion,
    page,
  });

  return (
    <WebinarsContent
      items={items}
      currentPage={Math.min(page, totalPages)}
      totalPages={totalPages}
      activeType={activeType}
      activeRegion={activeRegion}
      loadFailed={loadFailed}
    />
  );
}
