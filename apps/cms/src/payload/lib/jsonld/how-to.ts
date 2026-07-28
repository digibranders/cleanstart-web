import type { JsonLdContext } from './context';
import { imageObjectFromMedia, type ResolvedMedia } from './shared';
import type { JsonLdBlob } from './types';

export interface HowToStep {
  readonly heading: string;
  readonly body: string;
}

export interface HowToSource {
  /** Canonical absolute URL — also acts as `@id` of the HowTo. */
  readonly url: string;
  readonly title: string;
  readonly description?: string | null;
  readonly heroImage?: ResolvedMedia | null;
  /**
   * ISO 8601 duration (e.g. `PT15M`). Editors enter human strings;
   * caller is responsible for normalizing before calling. We emit
   * verbatim — Google validates.
   */
  readonly totalTime?: string | null;
  readonly prepTime?: string | null;
  readonly performTime?: string | null;
  /** Estimated cost in USD. Free-text but recommended numeric. */
  readonly estimatedCost?: string | null;
  readonly steps: readonly HowToStep[];
}

const stepBlob = (
  step: HowToStep,
  parentUrl: string,
  position: number,
): Record<string, unknown> => {
  const anchor = `${parentUrl}#step-${position}`;
  return {
    '@type': 'HowToStep',
    '@id': anchor,
    position,
    name: step.heading,
    text: step.body,
    url: anchor,
  };
};

/**
 * Build a Schema.org HowTo blob from a guide that has step-style
 * `articleSections[]`. Returns null when there are no steps — emitting
 * a HowTo with zero steps is a Google Rich Results validation error.
 *
 * The HowTo is emitted ALONGSIDE the guide's TechArticle, not instead
 * of it. The two co-exist with different `@id`s (the article uses
 * the canonical URL, the HowTo appends `#howto`).
 */
export const buildHowToBlob = (
  ctx: JsonLdContext,
  source: HowToSource,
): JsonLdBlob | null => {
  if (!source.title || !source.url) return null;
  if (source.steps.length === 0) return null;

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${source.url}#howto`,
    name: source.title,
    inLanguage: ctx.site.defaultLocale,
    step: source.steps.map((step, index) =>
      stepBlob(step, source.url, index + 1),
    ),
  };

  if (source.description) blob.description = source.description;

  const image = imageObjectFromMedia(source.heroImage);
  if (image) blob.image = image;

  if (source.totalTime) blob.totalTime = source.totalTime;
  if (source.prepTime) blob.prepTime = source.prepTime;
  if (source.performTime) blob.performTime = source.performTime;
  if (source.estimatedCost) blob.estimatedCost = source.estimatedCost;

  return blob as JsonLdBlob;
};
