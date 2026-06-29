import { isNoindexHost } from "@/lib/seo/indexing";

/**
 * Leadfeeder / Dealfront tracker account id, sourced from
 * `NEXT_PUBLIC_LEADFEEDER_ID`.
 *
 * Mirrors the GA4 contract (lib/analytics/ga4.ts): set only on the production
 * deploy, read at call time so it is stubbable in tests, and validated so a
 * typo fails safe — the caller renders nothing rather than injecting a broken
 * loader. The id is interpolated into the loader URL
 * (`https://sc.lfeeder.com/lftracker_v1_<id>.js`), so it must be strictly
 * alphanumeric (no quote/path/script-breaking characters).
 */
const LEADFEEDER_ID_PATTERN = /^[A-Za-z0-9]+$/;

export function leadfeederAccountId(): string | null {
  const id = process.env.NEXT_PUBLIC_LEADFEEDER_ID?.trim();
  return id && LEADFEEDER_ID_PATTERN.test(id) ? id : null;
}

/**
 * Resolve whether — and with which id — the Leadfeeder tracker should load for
 * a given host.
 *
 * The Vercel "Production" environment serves BOTH the canonical site
 * (www.cleanstart.com) and its noindex QA alias (staging.cleanstart.com) from
 * the SAME build, so `NEXT_PUBLIC_LEADFEEDER_ID` is baked into both. A runtime
 * host check keeps staging / preview traffic out of the production Leadfeeder
 * account: a host we don't index is a host we don't track. A missing host fails
 * safe to "don't load". Local dev is already excluded because the env var is
 * unset there (production-only).
 *
 * @returns the account id to load, or null to render nothing.
 */
export function resolveLeadfeederAccountId(
  hostname: string | null | undefined,
): string | null {
  const id = leadfeederAccountId();
  if (!id) return null;
  if (!hostname || isNoindexHost(hostname)) return null;
  return id;
}
