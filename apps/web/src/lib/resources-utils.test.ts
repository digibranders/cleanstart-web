import { describe, expect, it } from "vitest";

import {
  orderResourceTypes,
  resolveResourceTypeLabel,
  resolveResourceTypeSlug,
  type ResourceTypeSource,
} from "./resources-utils";

const term = (slug: string, name: string) => ({ id: 1, slug, name });

describe("resolveResourceTypeSlug", () => {
  it("prefers the populated relationship over the legacy enum", () => {
    const resource: ResourceTypeSource = {
      type: "datasheet",
      typeRef: term("solution-brief", "Solution Brief"),
    };
    expect(resolveResourceTypeSlug(resource)).toBe("solution-brief");
  });

  it("falls back to the enum when the relationship is not backfilled", () => {
    expect(resolveResourceTypeSlug({ type: "ebook", typeRef: null })).toBe("ebook");
  });

  it("falls back to the enum when the relationship came back unpopulated", () => {
    expect(resolveResourceTypeSlug({ type: "report", typeRef: 42 })).toBe("report");
  });

  it("is null when neither field is set", () => {
    expect(resolveResourceTypeSlug({})).toBeNull();
  });
});

describe("resolveResourceTypeLabel", () => {
  it("uses the term name, so an editor-added type needs no code change", () => {
    expect(
      resolveResourceTypeLabel({ type: null, typeRef: term("solution-brief", "Solution Brief") }),
    ).toBe("Solution Brief");
  });

  it("falls back to the enum label", () => {
    expect(resolveResourceTypeLabel({ type: "architecture-insights" })).toBe(
      "Architecture Insights",
    );
  });

  it("degrades to the generic label when a resource has no type at all", () => {
    expect(resolveResourceTypeLabel({})).toBe("Resource");
  });
});

describe("orderResourceTypes", () => {
  it("restores the established rail order regardless of CMS order", () => {
    const fromCms = [
      term("report", "Report"),
      term("architecture-insights", "Architecture Insights"),
      term("datasheet", "Datasheet"),
      term("ebook", "Ebook"),
      term("whitepaper", "Whitepaper"),
    ];
    expect(orderResourceTypes(fromCms).map((t) => t.value)).toEqual([
      "whitepaper",
      "ebook",
      "datasheet",
      "architecture-insights",
      "report",
    ]);
  });

  it("appends editor-added types alphabetically after the seeded five", () => {
    const fromCms = [
      term("solution-brief", "Solution Brief"),
      term("whitepaper", "Whitepaper"),
      term("benchmark", "Benchmark"),
    ];
    expect(orderResourceTypes(fromCms).map((t) => t.value)).toEqual([
      "whitepaper",
      "benchmark",
      "solution-brief",
    ]);
  });

  it("does not mutate the array it is given", () => {
    const fromCms = [term("report", "Report"), term("whitepaper", "Whitepaper")];
    orderResourceTypes(fromCms);
    expect(fromCms.map((t) => t.slug)).toEqual(["report", "whitepaper"]);
  });
});
