import { describe, expect, it } from "vitest";

import {
  advisoryHeading,
  cvssRating,
  selectAdvisories,
  technologyOptions,
  type AdvisoryRow,
} from "./advisory-utils";

const row = (over: Partial<AdvisoryRow>): AdvisoryRow => ({
  id: "1",
  title: "Node.js Brotli decoder out-of-bounds write",
  slug: "node-brotli",
  technology: "Node.js",
  cves: ["CVE-2026-111497"],
  cvssScore: 9.2,
  fixStatus: "fixed",
  ...over,
});

const ALL: AdvisoryRow[] = [
  row({}),
  row({ id: "2", title: "PHP2Shell", slug: "php2shell", technology: "PHP", cves: ["CVE-2026-109618", "CVE-2026-109619"], fixStatus: "in_progress" }),
  row({ id: "3", title: "OpenSSL bug", slug: "openssl", technology: "node.js ", cves: ["CVE-2025-0001"], fixStatus: "not_affected" }),
];

describe("cvssRating", () => {
  it("uses the CVSS v3/v4 severity bands", () => {
    expect(cvssRating(10)).toBe("Critical");
    expect(cvssRating(9.0)).toBe("Critical");
    expect(cvssRating(8.9)).toBe("High");
    expect(cvssRating(7.0)).toBe("High");
    expect(cvssRating(6.9)).toBe("Medium");
    expect(cvssRating(4.0)).toBe("Medium");
    expect(cvssRating(3.9)).toBe("Low");
    expect(cvssRating(0.1)).toBe("Low");
    expect(cvssRating(0)).toBe("None");
  });
});

describe("advisoryHeading", () => {
  it("prefixes every CVE ID", () => {
    expect(advisoryHeading(row({ title: "PHP2Shell", cves: ["CVE-2026-109618", "CVE-2026-109619"] }))).toBe("CVE-2026-109618, CVE-2026-109619: PHP2Shell");
  });
  it("falls back to the name when no CVE is set", () => {
    expect(advisoryHeading(row({ cves: [] }))).toBe("Node.js Brotli decoder out-of-bounds write");
  });
});

describe("technologyOptions", () => {
  it("merges spellings that differ only by case or spacing, keeping the first", () => {
    expect(technologyOptions(ALL)).toEqual([
      { value: "node.js", label: "Node.js" },
      { value: "php", label: "PHP" },
    ]);
  });
});

describe("selectAdvisories", () => {
  it("returns everything with no filters", () => {
    expect(selectAdvisories(ALL, { technology: "", status: "", q: "" })).toHaveLength(3);
  });
  it("filters by technology case-insensitively", () => {
    expect(selectAdvisories(ALL, { technology: "node.js", status: "", q: "" }).map((a) => a.id)).toEqual(["1", "3"]);
  });
  it("filters by status", () => {
    expect(selectAdvisories(ALL, { technology: "", status: "fixed", q: "" }).map((a) => a.id)).toEqual(["1"]);
  });
  it("matches a partial, lower-case CVE ID", () => {
    expect(selectAdvisories(ALL, { technology: "", status: "", q: "cve-2026-1096" }).map((a) => a.id)).toEqual(["2"]);
    expect(selectAdvisories(ALL, { technology: "", status: "", q: " 111497 " }).map((a) => a.id)).toEqual(["1"]);
  });
  it("also matches the vulnerability name", () => {
    expect(selectAdvisories(ALL, { technology: "", status: "", q: "brotli" }).map((a) => a.id)).toEqual(["1"]);
  });
  it("combines filters and search", () => {
    expect(selectAdvisories(ALL, { technology: "node.js", status: "fixed", q: "openssl" })).toHaveLength(0);
  });
});
