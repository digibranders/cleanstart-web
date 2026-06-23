import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Architecture fitness test: the CMS dispatcher must build content-type
// breadcrumbs from the shared breadcrumbTrail builder. The ONLY inline
// `buildBreadcrumbBlob(ctx, [ ... ])` call allowed is the editor-defined
// `pages` trail (fed by readPageBreadcrumb). A second inline array means a
// content-type trail was hand-written again and can drift from the live site.
const dispatchSrc = readFileSync(
  fileURLToPath(new URL("./dispatch.ts", import.meta.url)),
  "utf8",
);

describe("breadcrumb single-source guard (cms)", () => {
  it("dispatcher uses the shared breadcrumbTrail builder", () => {
    expect(dispatchSrc).toContain("breadcrumbTrail");
  });

  it("only the editor-defined pages trail remains an inline array", () => {
    const inline = dispatchSrc.match(/buildBreadcrumbBlob\(ctx, \[/g) ?? [];
    expect(inline.length).toBe(1);
  });
});
