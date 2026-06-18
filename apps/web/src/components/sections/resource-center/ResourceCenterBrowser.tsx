"use client";

import { useSearchParams } from "next/navigation";
import {
  ResourceCenterContent,
  selectResources,
} from "@/components/sections/resource-center/ResourceCenterContent";
import type { Resource } from "@/lib/resources";

interface ResourceCenterBrowserProps {
  allResources: Resource[];
}

/**
 * Client driver for the /resource-center listing. Reads the type / search / page
 * filters from the URL (`useSearchParams`) and filters the full card set in
 * memory, so the route stays statically rendered. Must be wrapped in a
 * `<Suspense>` boundary by the page. See `BlogsBrowser.tsx`.
 */
export function ResourceCenterBrowser({
  allResources,
}: ResourceCenterBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const activeType = params.get("type") ?? "";
  const searchQuery = params.get("q") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const { resources, totalPages } = selectResources(allResources, {
    type: activeType,
    search: searchQuery,
    page,
  });

  return (
    <ResourceCenterContent
      resources={resources}
      activeType={activeType}
      searchQuery={searchQuery}
      currentPage={Math.min(page, totalPages)}
      totalPages={totalPages}
    />
  );
}
