import type { WebPageVariant } from "@cleanstart/schema";

import { fetchCMS } from "./cms-fetch";

type WebPageTypeValue = WebPageVariant | "none";

interface PageRegistryDoc {
  additionalSchema?: unknown;
  webPageType?: WebPageTypeValue | null;
  title?: string | null;
}

interface PageRegistryResponse {
  docs?: Array<PageRegistryDoc>;
}

export interface PageRegistryEntry {
  /** Editor-authored raw Schema.org override (or undefined). */
  override?: unknown;
  /** Functional WebPage @type for this route ('none' = emit no WebPage node). */
  webPageType: WebPageTypeValue;
  /** Registry title, used as the WebPage node's `name`. */
  title?: string;
}

/**
 * Fetch the full schema-relevant `pageRegistry` row for a STATIC or LISTING
 * route, keyed by its path: the editor override, the functional WebPage @type,
 * and the title. Returns a safe default ({ webPageType: 'none' }) when no row
 * exists or the CMS is unreachable.
 *
 * Build/ISR-time only: `fetchCMS` caches the response (revalidate window +
 * on-demand revalidation on a registry edit), so the values are baked into the
 * page's static HTML — no per-request CMS dependency (INV-1).
 */
export async function getRegistryEntry(path: string): Promise<PageRegistryEntry> {
  try {
    const query = new URLSearchParams({
      "where[path][equals]": path,
      limit: "1",
      depth: "0",
    });
    const res = await fetchCMS<PageRegistryResponse>(`/api/pageRegistry?${query.toString()}`);
    const doc = res.docs?.[0];
    return {
      override: doc?.additionalSchema ?? undefined,
      webPageType: doc?.webPageType ?? "none",
      ...(doc?.title ? { title: doc.title } : {}),
    };
  } catch {
    return { webPageType: "none" };
  }
}

/**
 * Back-compat: just the editor override for a route. Prefer `getPageGraph`
 * (compose-page.ts), which also emits the functional WebPage node.
 */
export async function getRegistryOverride(path: string): Promise<unknown> {
  return (await getRegistryEntry(path)).override;
}
