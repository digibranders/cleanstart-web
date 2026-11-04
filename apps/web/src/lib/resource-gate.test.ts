import { describe, expect, it } from "vitest";

import { resolveResourceGate } from "./resource-gate";
import type { ResourceDetail } from "./resources";

const base = { id: "36", title: "Report", slug: "report" } as ResourceDetail;
const asset = { id: "503", url: "https://cdn.cleanstart.com/web/resource/report.pdf" };

describe("resolveResourceGate", () => {
  it("withholds the file link when a gate form is set", () => {
    expect(resolveResourceGate({ ...base, gated: true, gateForm: 11, asset })).toEqual({
      gated: true,
      gateFormId: 11,
      assetHref: "#",
    });
  });

  it("reads the form id from an object, as an authenticated draft preview returns it", () => {
    expect(
      resolveResourceGate({ ...base, gated: true, gateForm: { id: "11" }, asset }).gateFormId,
    ).toBe(11);
  });

  it("links straight to the file when the resource is not gated", () => {
    expect(resolveResourceGate({ ...base, gated: false, asset })).toEqual({
      gated: false,
      gateFormId: null,
      assetHref: asset.url,
    });
  });

  it("reports no gate form when none is attached", () => {
    expect(resolveResourceGate({ ...base, gated: true, gateForm: null, asset }).gateFormId).toBeNull();
  });
});
