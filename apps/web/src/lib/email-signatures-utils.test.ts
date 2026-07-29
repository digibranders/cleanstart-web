import { describe, expect, it } from "vitest";

import {
  SIGNATURE_GROUP_ORDER,
  filterSignatures,
  groupSignatures,
  type EmailSignatureSummary,
} from "./email-signatures-utils";

const person = (
  name: string,
  group: string,
  sortOrder = 0,
  jobTitle = "Title",
): EmailSignatureSummary => ({
  id: name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  jobTitle,
  email: `${name.toLowerCase().replace(/\s+/g, ".")}@cleanstart.com`,
  group,
  sortOrder,
});

describe("filterSignatures", () => {
  const roster = [
    person("Nilesh Jain", "Executive Leadership", 0, "Co-founder & CEO"),
    person("Arjun D J", "Sales & Regional Leadership", 1, "Regional Sales Manager"),
    person("Pallavi Puri", "Marketing & Communications", 2, "Head of Marketing"),
  ];

  it("returns the whole roster for a blank query", () => {
    expect(filterSignatures(roster, "")).toEqual(roster);
    expect(filterSignatures(roster, "   ")).toEqual(roster);
  });

  it("matches on name regardless of case", () => {
    expect(filterSignatures(roster, "NILESH").map((p) => p.name)).toEqual([
      "Nilesh Jain",
    ]);
  });

  it("matches on job title, email and group as well as name", () => {
    expect(filterSignatures(roster, "marketing").map((p) => p.name)).toEqual([
      "Pallavi Puri",
    ]);
    expect(filterSignatures(roster, "arjun.d.j@cleanstart").map((p) => p.name)).toEqual([
      "Arjun D J",
    ]);
    expect(filterSignatures(roster, "executive").map((p) => p.name)).toEqual([
      "Nilesh Jain",
    ]);
  });

  it("requires every token to match, across different fields", () => {
    // Name from one field, team from another — how a half-remembered colleague
    // actually gets typed in.
    expect(filterSignatures(roster, "arjun sales").map((p) => p.name)).toEqual([
      "Arjun D J",
    ]);
    expect(filterSignatures(roster, "arjun marketing")).toEqual([]);
  });

  it("returns nothing when nobody matches", () => {
    expect(filterSignatures(roster, "zzz")).toEqual([]);
  });
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

  it("lists no duplicate groups", () => {
    // Set equality against the CMS enum is enforced from the other side, by
    // `apps/cms/.../email-signature-groups.routes.test.ts`, which reads this
    // file. Restating the names here could only ever agree with itself.
    expect(new Set(SIGNATURE_GROUP_ORDER).size).toBe(SIGNATURE_GROUP_ORDER.length);
  });

  it("leads with the groups actually in use, so the page opens on leadership", () => {
    expect(SIGNATURE_GROUP_ORDER[0]).toBe("Executive Leadership");
    expect(SIGNATURE_GROUP_ORDER.indexOf("Sales & Regional Leadership")).toBe(1);
  });
});
