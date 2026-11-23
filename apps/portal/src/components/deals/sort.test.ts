import { describe, expect, it } from "vitest";
import type { RegistrationListItem } from "@/lib/dto";
import { sortDeals } from "./sort";

const deal = (customer: string, expectedClose: string | null, registeredOn: string): RegistrationListItem =>
  ({ customer, expectedClose, registeredOn, protectionEnd: null, status: "pending", region: "india" }) as RegistrationListItem;

const names = (rows: RegistrationListItem[]): string[] => rows.map((d) => d.customer);

describe("sortDeals", () => {
  const rows = [deal("B", "2026-12-01", "2026-11-02"), deal("a", null, "2026-11-03"), deal("C", "soon", "2026-11-01")];

  it("sorts customers case-insensitively in both directions", () => {
    expect(names(sortDeals(rows, "customer", "asc"))).toEqual(["a", "B", "C"]);
    expect(names(sortDeals(rows, "customer", "desc"))).toEqual(["C", "B", "a"]);
  });

  it("keeps rows with no real close date last in either direction", () => {
    expect(names(sortDeals(rows, "close", "asc"))[0]).toBe("B");
    expect(names(sortDeals(rows, "close", "desc"))[0]).toBe("B");
  });

  it("does not change the input", () => {
    sortDeals(rows, "registered", "asc");
    expect(names(rows)).toEqual(["B", "a", "C"]);
  });
});
