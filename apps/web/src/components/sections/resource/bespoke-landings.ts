import type { ResourceDetail } from "@/lib/resources";

import { DependencyTrustLanding } from "./dependency-trust/DependencyTrustLanding";

/**
 * Resources that get a designed landing page in place of the standard detail
 * template, keyed by slug. The record stays in the CMS (listing card, SEO,
 * gate form, download count); only the body of its page is replaced.
 */
export const BESPOKE_RESOURCE_LANDINGS: Readonly<
  Record<string, (props: { resource: ResourceDetail }) => React.ReactElement>
> = {
  "state-of-software-dependency-trust": DependencyTrustLanding,
};
