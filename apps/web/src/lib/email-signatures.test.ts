import { describe, expect, it } from "vitest";

import {
  SIGNATURE_GROUP_ORDER,
  groupSignatures,
  type EmailSignatureSummary,
} from "./email-signatures";

const person = (
  name: string,
  group: string,
  sortOrder = 0,
): EmailSignatureSummary => ({
  id: name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  jobTitle: "Title",
  email: `${name.toLowerCase().replace(/\s+/g, ".")}@cleanstart.com`,
  group,
  sortOrder,
});

describe("groupSignatures", () => {
  it("orders groups by the directory order, not alphabetically", () => {
    const result = groupSignatures([
      person("Abhishek Negi", "Engineering & Technical Solutions"),
      person("Nilesh Jain", "Executive Leadership"),
      person("Pallavi Puri", "Marketing & Communications"),
    ]);

    expect(result.map((entry) => entry.group)).toEqual([
      "Executive Leadership",
      "Marketing & Communications",
      "Engineering & Technical Solutions",
    ]);
  });

  it("drops groups that have nobody in them", () => {
    const result = groupSignatures([person("Nilesh Jain", "Executive Leadership")]);
    expect(result).toHaveLength(1);
    expect(result[0]?.group).toBe("Executive Leadership");
  });

  it("keeps everyone in the same group together", () => {
    const result = groupSignatures([
      person("Nilesh Jain", "Executive Leadership"),
      person("Biswajit De", "Executive Leadership"),
    ]);
    expect(result[0]?.people.map((p) => p.name)).toEqual([
      "Nilesh Jain",
      "Biswajit De",
    ]);
  });

  it("still renders a group added in the CMS but not yet known here", () => {
    // Otherwise those people would silently vanish from the directory.
    const result = groupSignatures([
      person("Nilesh Jain", "Executive Leadership"),
      person("New Person", "Customer Success"),
    ]);

    expect(result.map((entry) => entry.group)).toEqual([
      "Executive Leadership",
      "Customer Success",
    ]);
  });

  it("returns nothing for an empty roster", () => {
    expect(groupSignatures([])).toEqual([]);
  });

  it("covers every group the CMS collection offers", () => {
    // Guards against the two lists drifting apart — a group present in the CMS
    // but missing here would render in the unknown-group tail instead of its
    // intended position.
    expect(SIGNATURE_GROUP_ORDER).toEqual([
      "Executive Leadership",
      "Sales & Regional Leadership",
      "Marketing & Communications",
      "HR & People Operations",
      "Account Management & Sales Operations",
      "Engineering & Technical Solutions",
    ]);
  });
});
