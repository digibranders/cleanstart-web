import { describe, expect, it } from "vitest";
import type { PartnerViewer, StaffViewer } from "@/server/auth/types";
import { navFor } from "./routes";

const partner = (role: PartnerViewer["role"]): PartnerViewer => ({
  id: "u1",
  kind: "partner",
  role,
  partnerId: "p1",
  partnerName: "Kestrel Systems",
  email: "aditi@example.com",
  name: "Aditi Rao",
});

const staff = (role: StaffViewer["role"]): StaffViewer => ({
  id: "u2",
  kind: "staff",
  role,
  partnerId: null,
  partnerName: null,
  region: "india",
  email: "farhan@example.com",
  name: "Farhan Qureshi",
});

const labels = (viewer: PartnerViewer | StaffViewer): string[] => navFor(viewer).map((item) => item.label);

describe("navFor", () => {
  it("gives a partner admin every partner item", () => {
    expect(labels(partner("partner_admin"))).toEqual(["Overview", "Deals", "Register deal", "Documents", "Team", "Company"]);
  });

  it("gives partner sales everything except Team", () => {
    expect(labels(partner("sales"))).toEqual(["Overview", "Deals", "Register deal", "Documents", "Company"]);
  });

  it("gives a technical partner user Documents and Company only", () => {
    expect(labels(partner("technical"))).toEqual(["Documents", "Company"]);
  });

  it("gives a partner manager every admin item", () => {
    expect(labels(staff("partner_manager"))).toEqual(["Deal approvals", "Partners", "Documents", "Reports", "Team", "Audit log"]);
  });

  it("gives staff sales approvals, partners and reports", () => {
    expect(labels(staff("sales"))).toEqual(["Deal approvals", "Partners", "Reports"]);
  });

  it("gives marketing Documents only", () => {
    expect(labels(staff("marketing"))).toEqual(["Documents"]);
  });

  it("keeps the approvals count key on the approvals item", () => {
    expect(navFor(staff("partner_manager"))[0]?.count).toBe("approvals");
  });
});
