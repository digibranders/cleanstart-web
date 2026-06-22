import { fetchCMS } from "./cms-fetch";

interface PageRegistryResponse {
  docs?: Array<{ additionalSchema?: unknown }>;
}

/**
 * Fetch the editor-authored Schema.org override for a STATIC or LISTING route
 * from the `pageRegistry` collection, keyed by its path. Returns `undefined`
 * when no row/override exists or the CMS is unreachable.
 *
 * Build/ISR-time only: `fetchCMS` caches the response (revalidate window +
 * on-demand revalidation on a registry edit), so the override is baked into the
 * page's static HTML — no per-request CMS dependency (INV-1). The try/catch
 * fails safe to the auto graph if the CMS is down at build.
 *
 * `pageRegistry` read access is public and `additionalSchema` is public-read,
 * so the anonymous build fetch receives the override.
 */
export async function getRegistryOverride(path: string): Promise<unknown> {
  try {
    const query = new URLSearchParams({
      "where[path][equals]": path,
      limit: "1",
      depth: "0",
    });
    const res = await fetchCMS<PageRegistryResponse>(`/api/pageRegistry?${query.toString()}`);
    return res.docs?.[0]?.additionalSchema ?? undefined;
  } catch {
    return undefined;
  }
}
