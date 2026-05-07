import type { JsonLdContext } from '../context';
import { imageObjectFromMedia, type ResolvedMedia } from '../shared';
import type { JsonLdBlob } from '../types';
import { absoluteUrl } from '../url';

import type {
  BreadcrumbListAddon,
  FaqPageAddon,
  HowToAddon,
  ReviewAddon,
  SoftwareApplicationAddon,
  VideoObjectAddon,
} from './types';

/**
 * Coerce a Payload media reference to a ResolvedMedia or null.
 * Number-only IDs (depth: 0) and missing values return null.
 */
const asMedia = (
  value: ResolvedMedia | number | null | undefined,
): ResolvedMedia | null => {
  if (!value || typeof value === 'number') return null;
  return value;
};

/* ---------------------------------------------------------------- HowTo */

export const buildHowToBlob = (
  pageUrl: string,
  addon: HowToAddon,
): JsonLdBlob | null => {
  if (!addon.name || !addon.description) return null;
  const steps = (addon.steps ?? [])
    .filter(
      (s): s is { name: string; text: string; image?: ResolvedMedia | number | null } =>
        typeof s.name === 'string' &&
        s.name.length > 0 &&
        typeof s.text === 'string' &&
        s.text.length > 0,
    )
    .map((s, i) => {
      const step: Record<string, unknown> = {
        '@type': 'HowToStep',
        position: i + 1,
        name: s.name,
        text: s.text,
      };
      const image = imageObjectFromMedia(asMedia(s.image));
      if (image) step.image = image;
      return step;
    });

  if (steps.length < 2) return null;

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${pageUrl}#howto`,
    name: addon.name,
    description: addon.description,
    step: steps,
  };
  if (addon.totalTime) blob.totalTime = addon.totalTime;
  return blob as JsonLdBlob;
};

/* ----------------------------------------------------------- VideoObject */

export const buildVideoObjectBlob = (
  pageUrl: string,
  addon: VideoObjectAddon,
): JsonLdBlob | null => {
  if (!addon.name || !addon.description || !addon.uploadDate || !addon.contentUrl) {
    return null;
  }
  const thumbnail = imageObjectFromMedia(asMedia(addon.thumbnail));
  if (!thumbnail) return null; // Google requires a thumbnail.

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${pageUrl}#video`,
    name: addon.name,
    description: addon.description,
    uploadDate: addon.uploadDate,
    contentUrl: addon.contentUrl,
    thumbnailUrl: typeof thumbnail.url === 'string' ? thumbnail.url : undefined,
  };
  if (addon.embedUrl) blob.embedUrl = addon.embedUrl;
  if (addon.duration) blob.duration = addon.duration;
  return blob as JsonLdBlob;
};

/* -------------------------------------------------------- FAQPage (manual) */

interface FaqEntry {
  '@type': 'Question';
  name: string;
  acceptedAnswer: { '@type': 'Answer'; text: string };
}

/**
 * Build a FAQPage blob from manual add-on questions only. The
 * dispatcher merges this with any auto-emitted FAQPage rather than
 * emitting a duplicate.
 */
export const buildManualFaqEntries = (addon: FaqPageAddon): FaqEntry[] => {
  return (addon.questions ?? [])
    .filter(
      (q): q is { question: string; answer: string } =>
        typeof q.question === 'string' &&
        q.question.length > 0 &&
        typeof q.answer === 'string' &&
        q.answer.length > 0,
    )
    .map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    }));
};

/* --------------------------------------------------------------- Review */

export const buildReviewBlob = (
  pageUrl: string,
  addon: ReviewAddon,
): JsonLdBlob | null => {
  if (!addon.itemReviewedName || typeof addon.ratingValue !== 'number') return null;
  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${pageUrl}#review`,
    itemReviewed: {
      '@type': addon.itemReviewedType ?? 'Product',
      name: addon.itemReviewedName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: addon.ratingValue,
      bestRating: 5,
      worstRating: 0,
    },
  };
  if (addon.reviewBody) blob.reviewBody = addon.reviewBody;
  if (addon.authorName) {
    blob.author = { '@type': 'Person', name: addon.authorName };
  }
  return blob as JsonLdBlob;
};

/* ------------------------------------------------- SoftwareApplication */

export const buildSoftwareApplicationBlob = (
  pageUrl: string,
  addon: SoftwareApplicationAddon,
): JsonLdBlob | null => {
  if (
    !addon.name ||
    !addon.category ||
    !addon.os ||
    addon.price == null ||
    !addon.currency
  ) {
    return null;
  }

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${pageUrl}#software`,
    name: addon.name,
    applicationCategory: addon.category,
    operatingSystem: addon.os,
    offers: {
      '@type': 'Offer',
      price: addon.price,
      priceCurrency: addon.currency,
    },
  };

  if (
    typeof addon.ratingValue === 'number' &&
    typeof addon.ratingCount === 'number' &&
    addon.ratingCount > 0
  ) {
    blob.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: addon.ratingValue,
      ratingCount: addon.ratingCount,
      bestRating: 5,
      worstRating: 0,
    };
  }

  return blob as JsonLdBlob;
};

/* --------------------------------------------------------- BreadcrumbList */

/**
 * Custom BreadcrumbList from editor-supplied crumbs. Returns null in
 * `suppress` mode so the caller knows to drop the auto-emitted one
 * without replacing it.
 */
export const buildBreadcrumbOverrideBlob = (
  ctx: JsonLdContext,
  addon: BreadcrumbListAddon,
): JsonLdBlob | null => {
  if (addon.mode !== 'replace') return null;
  const crumbs = (addon.crumbs ?? []).filter(
    (c): c is { name: string; path: string } =>
      typeof c.name === 'string' &&
      c.name.length > 0 &&
      typeof c.path === 'string' &&
      c.path.length > 0,
  );
  if (crumbs.length === 0) return null;

  const itemListElement = crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: /^https?:\/\//i.test(c.path) ? c.path : absoluteUrl(ctx.site.baseUrl, c.path),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
};
