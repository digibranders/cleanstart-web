// Client-safe resource helpers extracted from `lib/resources.ts` so
// client components don't transitively pull `next/headers` via the
// draft-mode-aware `cms-fetch`.

import type { ResourceType, ResourceTypeTerm } from "./resources";

/**
 * The two fields carrying a resource's type during the enum → taxonomy
 * transition. `typeRef` is the editor-managed relationship (source of truth);
 * `type` is the legacy enum, hidden in the admin and dropped once every
 * environment is backfilled.
 */
export type ResourceTypeSource = {
  type?: ResourceType | null;
  typeRef?: ResourceTypeTerm | string | number | null;
};

/**
 * Slug identifying a resource's type. Prefers the populated `typeRef` term
 * (editor-managed); falls back to the legacy `type` enum when the relationship
 * is not yet backfilled. Seeded term slugs equal the old enum values, so the
 * two are interchangeable for the original five and `?type=` URLs keep working.
 */
export function resolveResourceTypeSlug(
  resource: ResourceTypeSource,
): string | null {
  const ref = resource.typeRef;
  if (ref && typeof ref === "object" && ref.slug) return ref.slug;
  return resource.type ?? null;
}

/**
 * Display label for a resource's type. Prefers the `typeRef` term name, so a
 * type an editor adds reads correctly without a code change; falls back to the
 * legacy enum label.
 */
export function resolveResourceTypeLabel(
  resource: ResourceTypeSource,
): string {
  const ref = resource.typeRef;
  if (ref && typeof ref === "object" && ref.name) return ref.name;
  return resourceTypeLabel(resource.type);
}

/**
 * Human-readable label for a seeded resource-type slug. Editor-added types are
 * not in this map — call `resolveResourceTypeLabel` instead, which reads the
 * term's own name.
 */
export function resourceTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "whitepaper":
      return "Whitepaper";
    case "ebook":
      return "Ebook";
    case "datasheet":
      return "Datasheet";
    case "architecture-insights":
      return "Architecture Insights";
    case "report":
      return "Report";
    default:
      return "Resource";
  }
}

/** CTA copy for a resource card / download button. */
export function resourceCtaLabel(
  type: string | null | undefined,
  overrideText?: string | null,
): string {
  if (overrideText) return overrideText;
  switch (type) {
    case "whitepaper":
      return "Get the Whitepaper";
    case "ebook":
      return "Get the Ebook";
    case "datasheet":
      return "Get the Datasheet";
    case "architecture-insights":
      return "Read the Insights";
    case "report":
      return "Read the Report";
    default:
      return "Get the Resource";
  }
}

/** Mapped cover poster for a resource type. */
export function resourceCoverPoster(type: string | null | undefined): string {
  switch (type) {
    case "ebook":
      return "/images/resource-center/cover-poster/ebook-cover.webp";
    case "datasheet":
    case "report":
      return "/images/resource-center/cover-poster/datasheet-report.webp";
    case "whitepaper":
      return "/images/resource-center/cover-poster/whitepaper.webp";
    default:
      return "/images/resource-center/cover-poster/architecture-insights.webp";
  }
}

/** "Get the Complete [Type]" label for detail page lead-capture heading. */
export function resourceLeadCaptureHeading(
  type: string | null | undefined,
): string {
  switch (type) {
    case "whitepaper":
      return "Get the Complete Whitepaper";
    case "ebook":
      return "Get the Complete Ebook";
    case "datasheet":
      return "Get the Complete Datasheet";
    case "architecture-insights":
      return "Read the Full Insights";
    case "report":
      return "Get the Complete Report";
    default:
      return "Get the Complete Resource";
  }
}

/** One entry in the resource-type filter rail. */
export type ResourceTypeOption = { value: string; label: string };

/**
 * The seeded types in the order the live sidebar has always shown them. Used
 * as the ordering key for the CMS-driven list, and as the fallback rail when
 * the taxonomy fetch fails.
 */
export const RESOURCE_TYPES: ResourceTypeOption[] = [
  { value: "whitepaper", label: "Whitepaper" },
  { value: "ebook", label: "Ebook" },
  { value: "datasheet", label: "Datasheet" },
  { value: "architecture-insights", label: "Architecture Insights" },
  { value: "report", label: "Report" },
];

const SEEDED_ORDER = RESOURCE_TYPES.map((t) => t.value);

/**
 * Order CMS resource-type terms for the filter rail: the seeded five keep
 * their established sidebar order, and types an editor adds follow,
 * alphabetically. Keeps the live rail visually unchanged while letting a new
 * type appear without a deploy.
 */
export function orderResourceTypes(
  terms: ResourceTypeTerm[],
): ResourceTypeOption[] {
  const rank = (slug: string): number => {
    const i = SEEDED_ORDER.indexOf(slug);
    return i === -1 ? SEEDED_ORDER.length : i;
  };
  return [...terms]
    .sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name))
    .map((t) => ({ value: t.slug, label: t.name }));
}
