import { describe, expect, it } from "vitest";

import { PAGE_REGISTRY_TAG, pageRegistryTag } from "./page-registry";

/**
 * The tag is a contract with apps/cms: `pageRegistryCacheTag` in
 * apps/cms/src/payload/hooks/revalidate-page-registry.ts must produce the
 * identical string, or a registry edit purges a tag nothing reads and this
 * page serves the old row until the 24h data-cache window expires. Both sides
 * assert the same literals.
 */
describe("pageRegistryTag", () => {
  it("matches the literal the CMS revalidation hook purges", () => {
    expect(pageRegistryTag("/compare")).toBe("page-registry:/compare");
    expect(pageRegistryTag("/tricorder")).toBe("page-registry:/tricorder");
    expect(pageRegistryTag("/industries/financial-services")).toBe(
      "page-registry:/industries/financial-services",
    );
  });

  it("exposes a blanket tag for purging every registry read", () => {
    expect(PAGE_REGISTRY_TAG).toBe("page-registry");
  });
});
