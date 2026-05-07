/**
 * Per-`@type` required + recommended property tables used to compute
 * the green / amber / red status badge in the SEO sidebar's Schema
 * preview card.
 *
 * Last reviewed: 2026-05-07 against
 *   - https://schema.org spec (`required`/`recommended` per type)
 *   - Google Rich Results structured-data guidelines
 *
 * Update both the date and the table when the upstream specs change.
 *
 * The badge runs against whichever blob the dispatcher actually emits
 * for a given doc — if the blob's `@type` isn't in this map we treat
 * it as "unverified" (grey badge) rather than failing the editor.
 */

export interface SpecRule {
  /**
   * Properties that MUST be present and non-empty for the blob to be
   * spec-valid. A missing required field flips the badge to red.
   */
  readonly required: readonly string[];
  /**
   * Properties that are not strictly required but unlock additional
   * Rich Results impressions when present. Missing recommended field
   * flips the badge to amber (still valid, but leaves traffic on the
   * table).
   */
  readonly recommended: readonly string[];
}

/**
 * Schema.org `@type` → required/recommended property map.
 *
 * Keep keys in sync with the dispatcher in
 * `apps/cms/src/payload/lib/jsonld/dispatch.ts`. Add a row whenever
 * a new builder lands.
 */
export const SCHEMA_SPEC: Readonly<Record<string, SpecRule>> = {
  Article: {
    required: ['@context', '@type', 'headline', 'author', 'datePublished'],
    recommended: ['image', 'dateModified', 'publisher', 'mainEntityOfPage', 'description'],
  },
  NewsArticle: {
    required: ['@context', '@type', 'headline', 'author', 'datePublished'],
    recommended: ['image', 'dateModified', 'publisher', 'mainEntityOfPage', 'description'],
  },
  TechArticle: {
    required: ['@context', '@type', 'headline', 'author', 'datePublished'],
    recommended: [
      'image',
      'dateModified',
      'publisher',
      'mainEntityOfPage',
      'description',
      'about',
    ],
  },
  Person: {
    required: ['@context', '@type', 'name'],
    recommended: ['url', 'image', 'jobTitle', 'sameAs', 'worksFor'],
  },
  Organization: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['logo', 'sameAs', 'contactPoint', 'description'],
  },
  WebSite: {
    // `potentialAction` (sitelinks SearchAction) is intentionally
    // omitted from `recommended` — apps/web doesn't expose a public
    // search endpoint yet, and emitting a SearchAction with a broken
    // `target` URL is worse than not emitting one. Restore the
    // recommendation when site search ships (see `website.ts` — the
    // builder is ready to attach the SearchAction at that point).
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['inLanguage'],
  },
  BreadcrumbList: {
    required: ['@context', '@type', 'itemListElement'],
    recommended: [],
  },
  FAQPage: {
    required: ['@context', '@type', 'mainEntity'],
    recommended: [],
  },
  Event: {
    required: ['@context', '@type', 'name', 'startDate', 'location'],
    recommended: [
      'description',
      'image',
      'endDate',
      'eventAttendanceMode',
      'eventStatus',
      'organizer',
      'offers',
    ],
  },
  JobPosting: {
    required: [
      '@context',
      '@type',
      'title',
      'description',
      'datePosted',
      'hiringOrganization',
    ],
    recommended: [
      'validThrough',
      'employmentType',
      'jobLocation',
      'baseSalary',
      'experienceRequirements',
    ],
  },
  WebPage: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: [
      'description',
      'inLanguage',
      'isPartOf',
      'publisher',
      'primaryImageOfPage',
      'datePublished',
    ],
  },
  AboutPage: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['description', 'inLanguage', 'isPartOf', 'publisher'],
  },
  ContactPage: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['description', 'inLanguage', 'isPartOf', 'publisher'],
  },
  HowTo: {
    required: ['@context', '@type', 'name', 'description', 'step'],
    recommended: ['totalTime', 'image'],
  },
  VideoObject: {
    required: [
      '@context',
      '@type',
      'name',
      'description',
      'thumbnailUrl',
      'uploadDate',
      'contentUrl',
    ],
    recommended: ['embedUrl', 'duration'],
  },
  Review: {
    required: ['@context', '@type', 'itemReviewed', 'reviewRating'],
    recommended: ['author', 'reviewBody'],
  },
  SoftwareApplication: {
    required: [
      '@context',
      '@type',
      'name',
      'applicationCategory',
      'operatingSystem',
      'offers',
    ],
    recommended: ['aggregateRating'],
  },
};

export type BadgeSeverity = 'green' | 'amber' | 'red' | 'grey';

export interface BlobAudit {
  readonly blobType: string;
  readonly severity: BadgeSeverity;
  readonly missingRequired: readonly string[];
  readonly missingRecommended: readonly string[];
}

/**
 * Audit a single JSON-LD blob against `SCHEMA_SPEC`.
 *
 * Returns the per-blob severity and the list of missing properties.
 * Treats a property as "present" only when the blob has a non-empty
 * value (empty string, empty array, and `null` count as missing).
 */
export const auditBlob = (blob: Record<string, unknown>): BlobAudit => {
  const rawType = blob['@type'];
  const blobType =
    typeof rawType === 'string'
      ? rawType
      : Array.isArray(rawType) && typeof rawType[0] === 'string'
        ? rawType[0]
        : 'Unknown';

  const rule = SCHEMA_SPEC[blobType];
  if (!rule) {
    return {
      blobType,
      severity: 'grey',
      missingRequired: [],
      missingRecommended: [],
    };
  }

  const isPresent = (key: string): boolean => {
    const v = blob[key];
    if (v == null) return false;
    if (typeof v === 'string' && v.length === 0) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  };

  const missingRequired = rule.required.filter((k) => !isPresent(k));
  const missingRecommended = rule.recommended.filter((k) => !isPresent(k));

  const severity: BadgeSeverity =
    missingRequired.length > 0
      ? 'red'
      : missingRecommended.length > 0
        ? 'amber'
        : 'green';

  return { blobType, severity, missingRequired, missingRecommended };
};

/**
 * Audit a list of blobs and reduce to the worst-case severity. Used
 * for the top-level badge — a page is only "green" when every blob
 * it emits is green.
 */
export const auditBlobList = (
  blobs: readonly Record<string, unknown>[],
): {
  severity: BadgeSeverity;
  perBlob: readonly BlobAudit[];
} => {
  if (blobs.length === 0) {
    return { severity: 'grey', perBlob: [] };
  }
  const perBlob = blobs.map(auditBlob);
  const worst: BadgeSeverity = perBlob.some((b) => b.severity === 'red')
    ? 'red'
    : perBlob.some((b) => b.severity === 'amber')
      ? 'amber'
      : perBlob.some((b) => b.severity === 'grey')
        ? 'grey'
        : 'green';
  return { severity: worst, perBlob };
};
