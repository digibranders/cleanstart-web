import { RICH_RESULT_RULES } from "../validate/rich-result-lint";

/**
 * Starter templates for the guided block-builder. Given an allow-listed @type,
 * return a structurally-valid stub blob with required (and key recommended)
 * fields pre-shaped, so an editor fills values instead of authoring JSON-LD by
 * hand. Stubs use empty strings for editor-supplied text — they pass the
 * structural override validator but intentionally fail the rich-result linter
 * until filled, which drives the inline "missing field" hints.
 *
 * Pure + isomorphic (runs in the Payload admin browser bundle).
 */

export interface TemplateContext {
  /** Absolute page URL, e.g. https://www.cleanstart.com/about-us. */
  url?: string;
  /** Page title to seed `name`/`headline`. */
  name?: string;
}

type Blob = Record<string, unknown>;

const CTX = "https://schema.org";

const person = (name = ""): Blob => ({ "@type": "Person", name });
const org = (): Blob => ({ "@type": "Organization", name: "CleanStart" });

const CURATED: Record<string, (ctx: TemplateContext) => Blob> = {
  WebPage: (c) => ({ "@type": "WebPage", name: c.name ?? "", url: c.url ?? "", description: "" }),
  AboutPage: (c) => ({ "@type": "AboutPage", name: c.name ?? "", url: c.url ?? "", description: "" }),
  ContactPage: (c) => ({ "@type": "ContactPage", name: c.name ?? "", url: c.url ?? "", description: "" }),
  CollectionPage: (c) => ({
    "@type": "CollectionPage",
    name: c.name ?? "",
    url: c.url ?? "",
    description: "",
  }),
  ProfilePage: () => ({ "@type": "ProfilePage", mainEntity: person() }),
  FAQPage: () => ({
    "@type": "FAQPage",
    mainEntity: [{ "@type": "Question", name: "", acceptedAnswer: { "@type": "Answer", text: "" } }],
  }),
  QAPage: () => ({
    "@type": "QAPage",
    mainEntity: { "@type": "Question", name: "", acceptedAnswer: { "@type": "Answer", text: "" } },
  }),
  HowTo: () => ({
    "@type": "HowTo",
    name: "",
    step: [{ "@type": "HowToStep", name: "", text: "" }],
  }),
  Article: (c) => ({
    "@type": "Article",
    headline: c.name ?? "",
    image: "",
    datePublished: "",
    author: person(),
  }),
  NewsArticle: (c) => ({
    "@type": "NewsArticle",
    headline: c.name ?? "",
    image: "",
    datePublished: "",
    author: person(),
  }),
  TechArticle: (c) => ({
    "@type": "TechArticle",
    headline: c.name ?? "",
    image: "",
    datePublished: "",
    author: person(),
  }),
  BlogPosting: (c) => ({
    "@type": "BlogPosting",
    headline: c.name ?? "",
    image: "",
    datePublished: "",
    author: person(),
  }),
  CreativeWork: (c) => ({ "@type": "CreativeWork", name: c.name ?? "", author: person() }),
  SoftwareApplication: (c) => ({
    "@type": "SoftwareApplication",
    name: c.name ?? "",
    applicationCategory: "",
    operatingSystem: "",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  }),
  WebApplication: (c) => ({
    "@type": "WebApplication",
    name: c.name ?? "",
    applicationCategory: "",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  }),
  Service: (c) => ({ "@type": "Service", name: c.name ?? "", provider: org(), description: "" }),
  Course: (c) => ({ "@type": "Course", name: c.name ?? "", description: "", provider: org() }),
  Dataset: (c) => ({ "@type": "Dataset", name: c.name ?? "", description: "" }),
  VideoObject: (c) => ({
    "@type": "VideoObject",
    name: c.name ?? "",
    description: "",
    thumbnailUrl: "",
    uploadDate: "",
    contentUrl: "",
  }),
  Review: () => ({
    "@type": "Review",
    itemReviewed: { "@type": "Thing", name: "" },
    reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
    author: person(),
  }),
  AggregateRating: () => ({
    "@type": "AggregateRating",
    itemReviewed: { "@type": "Thing", name: "" },
    ratingValue: "4.5",
    ratingCount: "10",
  }),
  SpeakableSpecification: () => ({ "@type": "SpeakableSpecification", cssSelector: ["h1", ".summary"] }),
};

/**
 * Build a starter blob for an allow-listed @type. Curated types get a
 * realistic shape; any other type falls back to a generic stub seeded from the
 * rich-result rule's required fields (empty strings).
 */
export const templateForType = (type: string, ctx: TemplateContext = {}): Blob => {
  const curated = CURATED[type];
  if (curated) return { "@context": CTX, ...curated(ctx) };

  const rule = RICH_RESULT_RULES[type];
  const stub: Blob = { "@context": CTX, "@type": type };
  for (const field of rule?.required ?? []) stub[field] = "";
  return stub;
};
