// Client-safe resource helpers extracted from `lib/resources.ts` so
// client components don't transitively pull `next/headers` via the
// draft-mode-aware `cms-fetch`.

import type { ResourceType } from "./resources";

/** Human-readable label for a resource type. */
export function resourceTypeLabel(type: ResourceType | null | undefined): string {
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
  type: ResourceType | null | undefined,
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
export function resourceCoverPoster(type: ResourceType | null | undefined): string {
  switch (type) {
    case "ebook":
      return "/images/resource-center/cover-poster/ebook-cover.webp";
    case "datasheet":
    case "report":
      return "/images/resource-center/cover-poster/datasheet-report.webp";
    case "whitepaper":
      return "/images/resource-center/cover-poster/datasheet-cover.webp";
    default:
      return "/images/resource-center/cover-poster/architecture-insights.webp";
  }
}

/** "Get the Complete [Type]" label for detail page lead-capture heading. */
export function resourceLeadCaptureHeading(
  type: ResourceType | null | undefined,
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

/** All filterable types in sidebar order, matching the live site. */
export const RESOURCE_TYPES: Array<{ value: ResourceType; label: string }> = [
  { value: "whitepaper", label: "Whitepaper" },
  { value: "ebook", label: "Ebook" },
  { value: "datasheet", label: "Datasheet" },
  { value: "architecture-insights", label: "Architecture Insights" },
  { value: "report", label: "Report" },
];
