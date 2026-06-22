import type { Metadata } from "next";

import type { OrganizationConfig } from "@cleanstart/schema";

import { fetchCMS } from "../cms-fetch";

interface MediaRef {
  url?: string | null;
}
interface SameAsRow {
  url?: string | null;
}

/** Shape of the `seoDefaults` global (only the fields apps/web consumes). */
export interface SeoDefaultsDoc {
  defaultTitleTemplate?: string | null;
  defaultDescription?: string | null;
  defaultOgImage?: MediaRef | null;
  twitterHandle?: string | null;
  verification?: {
    google?: string | null;
    bing?: string | null;
    pinterest?: string | null;
    yandex?: string | null;
    facebookDomain?: string | null;
  } | null;
  organizationJsonLd?: {
    name?: string | null;
    legalName?: string | null;
    url?: string | null;
    logo?: MediaRef | null;
    sameAs?: SameAsRow[] | null;
  } | null;
  newsMediaOrganization?: {
    enabled?: boolean | null;
    foundingDate?: string | null;
    slogan?: string | null;
    masthead?: string | null;
    ethicsPolicy?: string | null;
    correctionsPolicy?: string | null;
    factCheckingPolicy?: string | null;
    actionableFeedbackPolicy?: string | null;
    unnamedSourcesPolicy?: string | null;
    diversityPolicy?: string | null;
    ownershipFundingInfo?: string | null;
    coveragePolicy?: string | null;
  } | null;
  additionalSchema?: unknown;
}

/**
 * Build/ISR-time fetch of the site-wide SEO defaults global. `depth=1` so the
 * logo + default OG image media URLs are populated. Returns null when the CMS
 * is unreachable — callers fall back to hardcoded defaults (INV-1). Read access
 * on the global is public, so the anonymous build receives it.
 */
export async function getSeoDefaults(): Promise<SeoDefaultsDoc | null> {
  try {
    return await fetchCMS<SeoDefaultsDoc>("/api/globals/seoDefaults?depth=1");
  } catch {
    return null;
  }
}

const clean = (v: string | null | undefined): string | undefined =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;

/** Map the global into the Organization builder's config (omitting empties). */
export function orgConfigFromDefaults(d: SeoDefaultsDoc | null): OrganizationConfig {
  const org = d?.organizationJsonLd ?? undefined;
  const news = d?.newsMediaOrganization ?? undefined;
  const cfg: OrganizationConfig = {};
  const name = clean(org?.name);
  if (name) cfg.name = name;
  const legalName = clean(org?.legalName);
  if (legalName) cfg.legalName = legalName;
  const url = clean(org?.url);
  if (url) cfg.url = url;
  const logoUrl = clean(org?.logo?.url);
  if (logoUrl) cfg.logoUrl = logoUrl;
  const sameAs = (org?.sameAs ?? [])
    .map((r) => clean(r?.url))
    .filter((u): u is string => u != null);
  if (sameAs.length > 0) cfg.sameAs = sameAs;
  if (news?.enabled) {
    const nm: NonNullable<OrganizationConfig["newsMedia"]> = {};
    const set = (key: keyof NonNullable<OrganizationConfig["newsMedia"]>, raw: string | null | undefined): void => {
      const v = clean(raw);
      if (v) nm[key] = v;
    };
    set("foundingDate", news.foundingDate);
    set("slogan", news.slogan);
    set("masthead", news.masthead);
    set("ethicsPolicy", news.ethicsPolicy);
    set("correctionsPolicy", news.correctionsPolicy);
    set("factCheckingPolicy", news.factCheckingPolicy);
    set("actionableFeedbackPolicy", news.actionableFeedbackPolicy);
    set("unnamedSourcesPolicy", news.unnamedSourcesPolicy);
    set("diversityPolicy", news.diversityPolicy);
    set("ownershipFundingInfo", news.ownershipFundingInfo);
    set("coveragePolicy", news.coveragePolicy);
    cfg.newsMedia = nm;
  }
  return cfg;
}

/** WebSite builder config (name/url) from the global. */
export function webSiteConfigFromDefaults(d: SeoDefaultsDoc | null): { name?: string; url?: string } {
  const org = d?.organizationJsonLd ?? undefined;
  const cfg: { name?: string; url?: string } = {};
  const name = clean(org?.name);
  if (name) cfg.name = name;
  const url = clean(org?.url);
  if (url) cfg.url = url;
  return cfg;
}

/**
 * Site-verification metadata from the CMS tokens. Gated on `enabled` (the
 * production indexing gate) so noindex hosts (staging/preview) never emit
 * verification tags. Returns undefined when nothing is set.
 */
export function verificationFromDefaults(
  d: SeoDefaultsDoc | null,
  enabled: boolean,
): Metadata["verification"] | undefined {
  if (!enabled) return undefined;
  const v = d?.verification ?? undefined;
  const google = clean(v?.google) ?? clean(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION);
  const yandex = clean(v?.yandex);
  const other: Record<string, string> = {};
  const bing = clean(v?.bing);
  if (bing) other["msvalidate.01"] = bing;
  const pinterest = clean(v?.pinterest);
  if (pinterest) other["p:domain_verify"] = pinterest;
  const fb = clean(v?.facebookDomain);
  if (fb) other["facebook-domain-verification"] = fb;

  const result: Metadata["verification"] = {};
  if (google) result.google = google;
  if (yandex) result.yandex = yandex;
  if (Object.keys(other).length > 0) result.other = other;
  return Object.keys(result).length > 0 ? result : undefined;
}
