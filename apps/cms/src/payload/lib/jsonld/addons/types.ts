/**
 * Discriminated-union shape mirrored from `fields/schema-addons.ts`
 * after Payload depth=1 resolution. The dispatcher walks
 * `doc.schemaAddons[]` and emits one JSON-LD blob per entry.
 *
 * `blockType` is Payload's required discriminator on `blocks` arrays.
 * Every block carries a `blockName?` (editor-facing label) and an `id?`
 * — both safely ignorable by the builders.
 */

import type { ResolvedMedia } from '../shared';

export interface HowToStep {
  readonly name?: string | null;
  readonly text?: string | null;
  readonly image?: ResolvedMedia | number | null;
}

export interface HowToAddon {
  readonly blockType: 'howTo';
  readonly name?: string | null;
  readonly description?: string | null;
  readonly totalTime?: string | null;
  readonly steps?: readonly HowToStep[] | null;
}

export interface VideoObjectAddon {
  readonly blockType: 'videoObject';
  readonly name?: string | null;
  readonly description?: string | null;
  readonly thumbnail?: ResolvedMedia | number | null;
  readonly uploadDate?: string | null;
  readonly contentUrl?: string | null;
  readonly embedUrl?: string | null;
  readonly duration?: string | null;
}

export interface FaqQuestion {
  readonly question?: string | null;
  readonly answer?: string | null;
}

export interface FaqPageAddon {
  readonly blockType: 'faqPage';
  readonly questions?: readonly FaqQuestion[] | null;
}

export interface ReviewAddon {
  readonly blockType: 'review';
  readonly itemReviewedType?: 'Product' | 'Service' | 'SoftwareApplication' | 'Organization' | null;
  readonly itemReviewedName?: string | null;
  readonly ratingValue?: number | null;
  readonly reviewBody?: string | null;
  readonly authorName?: string | null;
}

export interface SoftwareApplicationAddon {
  // The block slug is shortened to fit Postgres 63-char identifier
  // limits on auto-generated enum names (versioned collections add a
  // `_v_` prefix that eats budget). The builder maps these short
  // names back to the full schema.org property names on output.
  readonly blockType: 'softwareApp';
  readonly name?: string | null;
  /** Maps to schema.org `applicationCategory`. */
  readonly category?: string | null;
  /** Maps to schema.org `operatingSystem`. */
  readonly os?: string | null;
  readonly price?: string | null;
  /** Maps to schema.org `priceCurrency` inside Offer. */
  readonly currency?: string | null;
  /** Maps to schema.org `aggregateRating.ratingValue`. */
  readonly ratingValue?: number | null;
  /** Maps to schema.org `aggregateRating.ratingCount`. */
  readonly ratingCount?: number | null;
}

export interface BreadcrumbCrumbAddon {
  readonly name?: string | null;
  readonly path?: string | null;
}

export interface BreadcrumbListAddon {
  readonly blockType: 'breadcrumbList';
  readonly mode?: 'suppress' | 'replace' | null;
  readonly crumbs?: readonly BreadcrumbCrumbAddon[] | null;
}

export type SchemaAddon =
  | HowToAddon
  | VideoObjectAddon
  | FaqPageAddon
  | ReviewAddon
  | SoftwareApplicationAddon
  | BreadcrumbListAddon;
