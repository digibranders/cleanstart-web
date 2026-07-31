import * as Sentry from "@sentry/nextjs";

/**
 * Static listing pages (`/news`, `/events`, `/webinars`, `/blogs`, …) fetch
 * their full card set once at render time and swallow a failed CMS fetch
 * into an empty result, so a single bad request degrades to an empty
 * section instead of a 500. A bare `.catch(() => emptyResult)` makes that
 * degradation silent — a total data failure (a rejected query, an
 * unreachable CMS) ships an entirely blank listing to production with
 * nothing in the logs to say why. Call this from every such `.catch()` so
 * the failure is loud (server logs + Sentry) even though the page itself
 * stays up.
 */
export function logListingFetchFailure(
  route: string,
  source: string,
  error: unknown,
): void {
  console.error(
    `[${route}] ${source} fetch failed, rendering degraded listing`,
    error,
  );
  Sentry.captureException(error, { tags: { route, source } });
}
