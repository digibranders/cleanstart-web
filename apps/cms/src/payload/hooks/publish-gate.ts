import type { CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';

import { validateOverrideForCollection } from '../lib/jsonld/override-validator';

export type CheckSeverity = 'blocker' | 'warn';

export interface CheckResult {
  id: string;
  label: string;
  severity: CheckSeverity;
  pass: boolean;
  /** Present only when the check fails and has a human-readable explanation. */
  message: string | null;
}

/** Collections that have a word-count/reading-minutes field. */
const WORD_COUNT_COLLECTIONS = new Set(['blogs', 'news', 'guides']);

/** Collections that have a featuredImage field. */
const HAS_FEATURED_IMAGE = new Set([
  'blogs',
  'news',
  'guides',
  'resources',
  'knowledgeBase',
  'events',
  'webinars',
  'jobs',
  'pages',
]);

const SEO_TITLE_MIN = 30;
const SEO_TITLE_MAX = 60;
const META_DESC_MIN = 120;
const META_DESC_MAX = 160;

const resolveString = (raw: unknown): string | null => {
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return null;
};

export const runPublishChecks = (
  data: Record<string, unknown>,
  collectionSlug: string,
): CheckResult[] => {
  const seo = (data.seo ?? {}) as Record<string, unknown>;
  const checks: CheckResult[] = [];

  // --- SEO title ---
  const seoTitle = resolveString(seo.title) ?? resolveString(data.title) ?? resolveString(data.name);
  const titleLen = seoTitle?.length ?? 0;
  const titlePass = seoTitle != null && titleLen >= SEO_TITLE_MIN && titleLen <= SEO_TITLE_MAX;
  checks.push({
    id: 'seo-title',
    label: `SEO title (${SEO_TITLE_MIN}–${SEO_TITLE_MAX} chars)`,
    severity: 'blocker',
    pass: titlePass,
    message: titlePass
      ? null
      : seoTitle == null
        ? 'SEO title is missing.'
        : `SEO title is ${titleLen} chars; must be ${SEO_TITLE_MIN}–${SEO_TITLE_MAX}.`,
  });

  // --- Meta description ---
  const metaDesc = resolveString(seo.description) ?? resolveString(data.abstract as unknown);
  const descLen = metaDesc?.length ?? 0;
  const descPass = metaDesc != null && descLen >= META_DESC_MIN && descLen <= META_DESC_MAX;
  checks.push({
    id: 'meta-description',
    label: `Meta description (${META_DESC_MIN}–${META_DESC_MAX} chars)`,
    severity: 'blocker',
    pass: descPass,
    message: descPass
      ? null
      : metaDesc == null
        ? 'Meta description is missing.'
        : `Meta description is ${descLen} chars; must be ${META_DESC_MIN}–${META_DESC_MAX}.`,
  });

  // --- Slug ---
  const slug = resolveString(data.slug);
  const slugHasSpaces = typeof data.slug === 'string' && /\s/.test(data.slug);
  const slugPass = slug != null && !slugHasSpaces;
  checks.push({
    id: 'slug',
    label: 'Slug is set and has no spaces',
    severity: 'blocker',
    pass: slugPass,
    message: slugPass
      ? null
      : slug == null
        ? 'Slug is missing.'
        : 'Slug must not contain spaces.',
  });

  // --- Featured image (warn only) ---
  if (HAS_FEATURED_IMAGE.has(collectionSlug)) {
    const hasImage =
      data.featuredImage != null ||
      data.heroImage != null ||
      data.coverImage != null ||
      data.image != null;
    checks.push({
      id: 'featured-image',
      label: 'Featured image is set',
      severity: 'warn',
      pass: hasImage,
      message: hasImage ? null : 'No featured image — social sharing previews will be blank.',
    });
  }

  // --- JSON-LD override validity ---
  const additionalSchema = seo.additionalSchema;
  if (additionalSchema != null) {
    const result = validateOverrideForCollection(additionalSchema, collectionSlug);
    checks.push({
      id: 'jsonld-override',
      label: 'JSON-LD override is valid',
      severity: 'blocker',
      pass: result.ok,
      message: result.ok ? null : result.message,
    });
  }

  // --- Word count (warn only for long-form collections) ---
  if (WORD_COUNT_COLLECTIONS.has(collectionSlug)) {
    const readingMinutes = Number(data.readingMinutes ?? 0);
    const wordCountPass = readingMinutes > 0;
    checks.push({
      id: 'word-count',
      label: 'Article body is not empty',
      severity: 'warn',
      pass: wordCountPass,
      message: wordCountPass ? null : 'Body appears empty — readingMinutes is 0.',
    });
  }

  return checks;
};

/**
 * beforeChange hook factory for the publishing checklist gate.
 *
 * Runs only when `data._status === 'published'`. Blockers throw a
 * Payload `ValidationError`; warnings are logged but do not block
 * the save. The hook is a factory so the collection slug can be
 * baked in at config time.
 */
export const publishGateHook = (collectionSlug: string): CollectionBeforeChangeHook => {
  return ({ data }) => {
    if ((data as Record<string, unknown>)._status !== 'published') return data;

    const checks = runPublishChecks(data as Record<string, unknown>, collectionSlug);
    const blockers = checks.filter((c) => c.severity === 'blocker' && !c.pass);

    if (blockers.length === 0) return data;

    throw new ValidationError({
      errors: blockers.map((b) => ({
        message: `[Publish gate] ${b.label}: ${b.message ?? 'failed'}`,
        path: b.id,
      })),
    });
  };
};
