import { describe, expect, it } from "vitest";
import type { PartnerPersonDto } from "@/lib/dto";
import { hasActiveAdmin, inviteOnly, moveTargets } from "./partner-people-model";

const person = (over: Partial<PartnerPersonDto>): PartnerPersonDto => ({
  id: "u1",
  name: "Aditi Rao",
  email: "aditi@example.com",
  role: "sales",
  status: "active",
  lastActiveAt: null,
  invitedAt: null,
  title: null,
  phone: null,
  deals: 0,
  inviteId: null,
  twoFactorEnabled: false,
  ...over,
});

describe("hasActiveAdmin", () => {
  it("is false for nobody, for no admin, and for an admin who has only been invited", () => {
    expect(hasActiveAdmin([])).toBe(false);
    expect(hasActiveAdmin([person({})])).toBe(false);
    expect(hasActiveAdmin([person({ id: "i1", role: "partner_admin", status: "invited", inviteId: "i1" })])).toBe(false);
  });
  it("is true once an admin has accepted", () => {
    expect(hasActiveAdmin([person({}), person({ id: "a", role: "partner_admin" })])).toBe(true);
  });
});

describe("inviteOnly", () => {
  it("matches a row whose id is its invite id", () => {
    expect(inviteOnly(person({ id: "i1", inviteId: "i1", status: "invited" }))).toBe(true);
    expect(inviteOnly(person({ inviteId: "other" }))).toBe(false);
    expect(inviteOnly(person({}))).toBe(false);
  });
});

describe("moveTargets", () => {
  it("offers active sales and admin people who stay, not technical, invited or the leaver", () => {
    const leaver = person({ id: "leaver" });
    const stay = person({ id: "stay" });
    const admin = person({ id: "admin", role: "partner_admin" });
    const tech = person({ id: "tech", role: "technical" });
    const invited = person({ id: "inv", inviteId: "inv", status: "invited" });
    expect(moveTargets([leaver, stay, admin, tech, invited], leaver).map((p) => p.id)).toEqual(["stay", "admin"]);
  });
});
