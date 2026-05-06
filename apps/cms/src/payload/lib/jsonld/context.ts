/**
 * Read-only snapshot of the data every emitter needs to compose a
 * JSON-LD blob. Built once per request — the dispatcher loads
 * SiteSettings + SeoDefaults, derives the canonical Organization
 * `@id`, and passes this through to each emitter.
 *
 * Keep this surface small. Emitters that need fields not on this
 * shape should accept them as explicit args, not reach into a richer
 * context.
 */

export interface JsonLdImage {
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly alt?: string;
}

export interface JsonLdSameAs {
  readonly url: string;
}

/**
 * Sub-shape of `seoDefaults.organizationJsonLd` consumed by the
 * Organization emitter. Mirrors the editor-facing fields exactly.
 */
export interface OrganizationSource {
  readonly name?: string;
  readonly legalName?: string;
  readonly url?: string;
  readonly logo?: JsonLdImage | null;
  readonly sameAs?: readonly JsonLdSameAs[];
}

/**
 * Sub-shape of `seoDefaults.newsMediaOrganization`. When `enabled`
 * is true and at least one policy URL is set, the site-wide
 * Organization blob upgrades to a NewsMediaOrganization carrying
 * these fields. Mirrors the editor group exactly.
 */
export interface NewsMediaOrganizationSource {
  readonly enabled?: boolean;
  readonly foundingDate?: string | null;
  readonly slogan?: string | null;
  readonly masthead?: string | null;
  readonly ethicsPolicy?: string | null;
  readonly correctionsPolicy?: string | null;
  readonly verificationFactCheckingPolicy?: string | null;
  readonly actionableFeedbackPolicy?: string | null;
  readonly unnamedSourcesPolicy?: string | null;
  readonly diversityPolicy?: string | null;
  readonly ownershipFundingInfo?: string | null;
  readonly missionCoveragePrioritiesPolicy?: string | null;
}

export interface SiteSnapshot {
  readonly siteName: string;
  readonly baseUrl: string;
  readonly defaultLocale: string;
}

export interface JsonLdContext {
  readonly site: SiteSnapshot;
  readonly organization: OrganizationSource;
  readonly newsOrganization: NewsMediaOrganizationSource;
  /**
   * Stable canonical `@id` for the Organization. Used as a reference
   * (`{ '@id': orgId }`) from publisher / worksFor links so the
   * Organization blob is described once and pointed-to many times.
   */
  readonly organizationId: string;
}

/**
 * Build the per-request JsonLdContext from the two raw global docs.
 * Inputs are typed loosely so callers can pass the result of
 * `payload.findGlobal({ slug: 'siteSettings' })` (which returns a
 * Payload-generated type) without extra adapters.
 */
export const buildJsonLdContext = (args: {
  siteSettings: SiteSnapshot;
  seoDefaults: {
    organizationJsonLd?: OrganizationSource | null;
    newsMediaOrganization?: NewsMediaOrganizationSource | null;
  };
}): JsonLdContext => {
  const org = args.seoDefaults.organizationJsonLd ?? {};
  const newsOrg = args.seoDefaults.newsMediaOrganization ?? {};
  const baseUrl = args.siteSettings.baseUrl.replace(/\/+$/, '');
  return {
    site: { ...args.siteSettings, baseUrl },
    organization: org,
    newsOrganization: newsOrg,
    organizationId: `${baseUrl}/#organization`,
  };
};
