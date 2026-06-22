import { describe, expect, it } from "vitest";
import type { GraphNode, SchemaGraph } from "../index";

describe("@cleanstart/schema scaffold", () => {
  it("exports usable JSON-LD types", () => {
    const node: GraphNode = { "@type": "Organization", name: "CleanStart" };
    const graph: SchemaGraph = { "@context": "https://schema.org", "@graph": [node] };
    expect(graph["@graph"][0]?.["@type"]).toBe("Organization");
  });
});
