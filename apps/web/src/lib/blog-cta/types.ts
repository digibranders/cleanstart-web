/**
 * The three asks a blog article makes, ordered by how much they ask of the
 * reader: explore the image catalog (one click), learn from a gated resource
 * (a work email), prove it with a POC (a sales conversation).
 */
export type BlogCtaStage = "explore" | "learn" | "prove";

export const BLOG_CTA_STAGES: readonly BlogCtaStage[] = ["explore", "learn", "prove"];

/**
 * A catalog image's logo as it should be drawn. `src` is null when the portal
 * has no logo file for the image, and `tone` says which tile it reads on.
 */
export interface CatalogLogo {
  src: string | null;
  tone: "light" | "dark";
}

/** A specific catalog image matched to the article. */
export interface CatalogImageCta {
  kind: "image";
  /** Catalog slug, e.g. `redis` or `cert-manager-controller`. */
  name: string;
  /** First sentence of the catalog's own description, when it could be read. */
  description: string | null;
  logo: CatalogLogo;
  href: string;
  hasFips: boolean;
  /** A command anyone can run, only when the image is public on Docker Hub. */
  pullCommand: string | null;
}

/** Shown when no catalog image is a confident match for the article. */
export interface CatalogFallbackCta {
  kind: "catalog";
  /** Distinct images in the catalog (FIPS variants folded in), or null if the catalog was unreachable. */
  imageCount: number | null;
  /** A few well-known images to show as logos on the card. */
  featured: ReadonlyArray<{ name: string; logo: CatalogLogo }>;
  href: string;
  /** An example public pull, so the card is useful before the reader clicks through. */
  pullCommand: string | null;
}

export type ExploreCta = CatalogImageCta | CatalogFallbackCta;

export interface ResourceCta {
  slug: string;
  title: string;
  typeLabel: string;
  summary: string | null;
  href: string;
  ctaLabel: string;
  coverUrl: string;
  coverAlt: string;
  /** The cover is the generic type poster, which carries no title of its own. */
  coverIsPoster: boolean;
  gated: boolean;
}

export interface ProveCta {
  href: string;
  label: string;
}

export interface BlogCtaSet {
  slug: string;
  explore: ExploreCta;
  /** Null only when the CMS returned no published resources at all. */
  learn: ResourceCta | null;
  prove: ProveCta;
}

/** Which of the three review layouts rendered a CTA. Feeds analytics. */
export type BlogCtaLayout = "ladder";

/** Where on the page the CTA sat when it was clicked. */
export type BlogCtaPlacement = "rail" | "bar";
