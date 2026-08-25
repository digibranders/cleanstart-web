import { isNoindexHost } from "@/lib/seo/indexing";

/**
 * Apollo.io website visitor tracker app id, sourced from
 * `NEXT_PUBLIC_APOLLO_APP_ID`.
 *
 * Mirrors the Leadfeeder contract (lib/analytics/leadfeeder.ts): set only on
 * the production deploy, read at call time so it is stubbable in tests, and
 * validated so a typo fails safe — the caller renders nothing rather than
 * injecting a broken loader. The id is interpolated into an inline snippet
 * (`trackingFunctions.onLoad({appId:"..."})`), so it must be strictly
 * hex (Apollo issues 24-char MongoDB ObjectId app ids, e.g.
 * `691b73cb5443850011f553d1`) — no quote/script-breaking characters.
 */
const APOLLO_APP_ID_PATTERN = /^[a-f0-9]{24}$/;

export function apolloAppId(): string | null {
  const id = process.env.NEXT_PUBLIC_APOLLO_APP_ID?.trim();
  return id && APOLLO_APP_ID_PATTERN.test(id) ? id : null;
}

/**
 * Resolve whether — and with which id — the Apollo tracker should load for
 * a given host.
 *
 * The Vercel "Production" environment serves BOTH the canonical site
 * (www.cleanstart.com) and its `*.vercel.app` deployment aliases from the SAME
 * build, so `NEXT_PUBLIC_APOLLO_APP_ID` is baked into both. A runtime host
 * check keeps preview traffic out of the production Apollo account: a host we
 * don't index is a host we don't track. A missing host fails safe to "don't
 * load". Local dev is already excluded because the env var is unset there
 * (production-only).
 *
 * @returns the app id to load, or null to render nothing.
 */
export function resolveApolloAppId(
  hostname: string | null | undefined,
): string | null {
  const id = apolloAppId();
  if (!id) return null;
  if (!hostname || isNoindexHost(hostname)) return null;
  return id;
}
