import type { ResourceType } from "@/lib/resources";

/**
 * The "keep reading" rail under the stories.
 *
 * Hand-picked rather than "latest four": somebody who has just read three
 * customer outcomes wants the business case and the spec sheet, not whatever
 * shipped most recently. The blurb is written for this page — most of these
 * resources have no summary in the CMS, and the useful line here is why it
 * follows a case study, which the resource's own abstract would never say.
 *
 * `slug` is the contract with the CMS. A slug that stops resolving drops out
 * of the rail (see `getResourcesBySlugs`); update the list rather than letting
 * it thin out.
 */
export interface CuratedResource {
  readonly slug: string;
  /** Used when the CMS title is unavailable. */
  readonly fallbackTitle: string;
  readonly fallbackType: ResourceType;
  readonly blurb: string;
}

export const CASE_STUDY_RESOURCES: readonly CuratedResource[] = [
  {
    slug: "the-real-cost-of-public-container-images",
    fallbackTitle: "The Real Cost of Public Container Images",
    fallbackType: "whitepaper",
    blurb:
      "The spend behind every migration in these studies: triage hours, delayed releases, and the images nobody owns.",
  },
  {
    slug: "enterprise-grade-hardened-container-images",
    fallbackTitle: "Enterprise-Grade Hardened Container Images",
    fallbackType: "datasheet",
    blurb:
      "What the teams above actually standardized on, with the build, signing and support specifics.",
  },
  {
    slug: "beyond-cnapp-building-a-complete-software-supply-chain-security-strategy",
    fallbackTitle:
      "Beyond CNAPP: Building a Complete Software Supply Chain Security Strategy",
    fallbackType: "whitepaper",
    blurb:
      "Where a hardened foundation sits next to the scanning and posture tooling you already run.",
  },
  {
    slug: "securing-the-software-supply-chain-in-2026",
    fallbackTitle: "Securing the Software Supply Chain in 2026",
    fallbackType: "report",
    blurb:
      "The wider picture these engagements sit in: upstream attacks, CI/CD compromise and what regulators now expect.",
  },
];

export const CASE_STUDY_RESOURCE_SLUGS: readonly string[] = CASE_STUDY_RESOURCES.map(
  (r) => r.slug,
);
