import { describe, expect, it } from "vitest";
import type { PartnerViewer, StaffViewer } from "@/server/auth/types";
import { ADMIN_NAV, activeNavHref, joinWords, navFor, PARTNER_NAV, ROUTES, searchNouns } from "./routes";

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
  regions: ["india"],
  email: "gaurav@example.com",
  name: "Gaurav Jadhav",
});

const labels = (viewer: PartnerViewer | StaffViewer): string[] => navFor(viewer).map((item) => item.label);

describe("navFor", () => {
  it("gives a partner admin every partner item", () => {
    expect(labels(partner("partner_admin"))).toEqual(["Overview", "Deals", "Register deal", "Documents", "Messages", "Program", "Team", "Company", "Help"]);
  });

  it("gives partner sales everything except Team", () => {
    expect(labels(partner("sales"))).toEqual(["Overview", "Deals", "Register deal", "Documents", "Messages", "Program", "Company", "Help"]);
  });

  it("gives a technical partner user Documents, Program and Company only", () => {
    expect(labels(partner("technical"))).toEqual(["Documents", "Messages", "Program", "Company", "Help"]);
  });

  it("gives a partner manager every admin item", () => {
    expect(labels(staff("partner_manager"))).toEqual(["Overview", "Deals", "Messages", "Partners", "Documents", "Reports", "Team", "Regions", "Audit log", "Help"]);
  });

  it("gives staff sales approvals, partners and reports", () => {
    expect(labels(staff("sales"))).toEqual(["Overview", "Deals", "Messages", "Partners", "Reports", "Help"]);
  });

  it("gives marketing Overview only", () => {
    expect(labels(staff("marketing"))).toEqual(["Overview", "Messages", "Documents", "Help"]);
  });

  it("keeps the approvals count key on the approvals item", () => {
    expect(navFor(staff("partner_manager"))[1]?.count).toBe("approvals");
  });
});

describe("activeNavHref", () => {
  it("lights only Register deal on the new deal page", () => {
    expect(activeNavHref(PARTNER_NAV, "/partner/deals/new")).toBe("/partner/deals/new");
  });

  it("lights Deals on a deal and on the list", () => {
    expect(activeNavHref(PARTNER_NAV, "/partner/deals/abc")).toBe("/partner/deals");
    expect(activeNavHref(PARTNER_NAV, "/partner/deals")).toBe("/partner/deals");
  });

  it("lights Overview on the welcome page and nothing on the account page", () => {
    expect(activeNavHref(PARTNER_NAV, "/partner/welcome")).toBe("/partner/overview");
    expect(activeNavHref(PARTNER_NAV, "/partner/account")).toBeNull();
  });
});

describe("staff account route", () => {
  it("lives under /admin and is reached from the profile menu, not the sidebar", () => {
    expect(ROUTES.admin.account).toBe("/admin/account");
    expect(ADMIN_NAV.some((item) => item.href === ROUTES.admin.account)).toBe(false);
    expect(activeNavHref(ADMIN_NAV, ROUTES.admin.account)).toBeNull();
  });
});

describe("searchNouns", () => {
  it("names what each role can find", () => {
    expect(searchNouns("partner", navFor(partner("partner_admin")))).toEqual(["deals", "documents"]);
    expect(searchNouns("partner", navFor(partner("technical")))).toEqual(["documents"]);
    expect(searchNouns("admin", navFor(staff("partner_manager")))).toEqual(["partners", "deals", "documents"]);
    expect(searchNouns("admin", navFor(staff("sales")))).toEqual(["partners", "deals"]);
    expect(searchNouns("admin", navFor(staff("marketing")))).toEqual(["documents"]);
  });
});

describe("joinWords", () => {
  it("joins with commas and a final and", () => {
    expect(joinWords([])).toBe("");
    expect(joinWords(["deals"])).toBe("deals");
    expect(joinWords(["deals", "documents"])).toBe("deals and documents");
    expect(joinWords(["partners", "deals", "pages"])).toBe("partners, deals and pages");
  });
});
