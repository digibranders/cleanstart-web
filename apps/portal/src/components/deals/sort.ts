import type { RegistrationListItem } from "@/lib/dto";

export type DealSortKey = "customer" | "status" | "region" | "registered" | "close" | "protection";
export type SortDir = "asc" | "desc";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Expected close is free text on older rows; only a real date sorts, the rest sit with the empty ones. */
export const closeDate = (deal: Pick<RegistrationListItem, "expectedClose">): string | null =>
  deal.expectedClose && ISO_DAY.test(deal.expectedClose) ? deal.expectedClose : null;

const value = (deal: RegistrationListItem, key: DealSortKey): string | null => {
  switch (key) {
    case "customer":
      return deal.customer.toLowerCase();
    case "status":
      return deal.status;
    case "region":
      return deal.region;
    case "registered":
      return deal.registeredOn;
    case "close":
      return closeDate(deal);
    case "protection":
      return deal.protectionEnd;
  }
};

/** Stable sort; rows with no value for the key always go last, whichever way it runs. */
export function sortDeals(deals: readonly RegistrationListItem[], key: DealSortKey, dir: SortDir): RegistrationListItem[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...deals].sort((a, b) => {
    const x = value(a, key);
    const y = value(b, key);
    if (x === y) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return x < y ? -sign : sign;
  });
}
