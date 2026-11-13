import type { Product as ChipProduct, BadgeTone } from "../ui/badge";
import { sameCustomer } from "@/lib/customer";
import { acceptedOnFor, EXPIRING_SOON_DAYS, isOverSla, REVIEW_SLA_BUSINESS_DAYS, waitingBusinessDays } from "@/lib/deal-rules";
import type { DealRegion, Product, RegistrationStatus } from "@/lib/domain";
import type { ManagerOptionDto, RegistrationListItem } from "@/lib/dto";
import { daysLeft, fmtLong, fmtShort, plural } from "./dates";

export { sameCustomer };

/** CleanStart reviews a registration within this many business days. */
export const OVER_TARGET_DAYS = REVIEW_SLA_BUSINESS_DAYS;

/** ProductChip and the badge file speak in display labels; the data speaks in codes. */
export const CHIP_PRODUCT: Record<Product, ChipProduct> = {
  images: "CleanStart Images",
  libraries: "Clean Libraries",
  cleansight: "CleanSight",
};

export const firstWord = (name: string): string => name.split(" ")[0] ?? name;

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

/** A stable avatar tint class per name. */
export function avOf(name: string): string {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return `av-${(sum % 4) + 1}`;
}

/** Badge tones are named after the status codes. */
export const statusTone = (status: RegistrationStatus): BadgeTone => status;

type Reviewable = Pick<RegistrationListItem, "registeredOn" | "resubmittedOn">;

/** ISO date the current review started: the first submission, or the latest resubmission. */
export const reviewSince = (deal: Reviewable): string => deal.resubmittedOn ?? deal.registeredOn;

/** Business days waited, so a Friday registration is one day old on Monday. */
export const waitDays = (deal: Reviewable, today: string): number => waitingBusinessDays(reviewSince(deal), today);

export const isOverTarget = (deal: Reviewable & Pick<RegistrationListItem, "status">, today: string): boolean =>
  deal.status === "pending" && isOverSla(reviewSince(deal), today);

/** The day protection started: the last day minus 89, because the acceptance day counts. */
export const acceptedOn = (deal: Pick<RegistrationListItem, "protectionEnd">): string | null =>
  deal.protectionEnd ? acceptedOnFor(deal.protectionEnd) : null;

export interface ProtectionView {
  until: string;
  left: string;
  cls: string;
}

type ProtectionInput = Reviewable &
  Pick<RegistrationListItem, "status" | "protectionEnd" | "closedOn">;

/** The "Protection" cell: waiting time, protected-until date, or the closing date, depending on status. */
export function protectionView(deal: ProtectionInput, mode: "deals" | "overview", today: string): ProtectionView {
  switch (deal.status) {
    case "pending": {
      if (deal.resubmittedOn === today) return { until: "Resent today", left: "", cls: "t-muted" };
      const days = waitDays(deal, today);
      const late = isOverTarget(deal, today);
      return {
        until: days === 0 ? "Sent today" : `Waiting ${plural(days, "day")}`,
        left: mode === "deals" && late ? `over ${OVER_TARGET_DAYS}-day target` : "",
        cls: late ? "t-amber" : "t-muted",
      };
    }
    case "accepted": {
      const end = deal.protectionEnd;
      if (!end) return { until: "", left: "", cls: "t-ink" };
      const days = daysLeft(end, today);
      return { until: fmtLong(end), left: `${days}d`, cls: days <= EXPIRING_SOON_DAYS ? "t-amber" : "t-ink" };
    }
    case "won":
    case "lost":
      return { until: `Closed ${fmtShort(deal.closedOn ?? deal.registeredOn)}`, left: "", cls: "t-muted" };
    case "expired":
      return { until: `Ended ${fmtShort(deal.closedOn ?? deal.registeredOn)}`, left: "", cls: "t-muted" };
    case "rejected":
      return { until: "Not protected", left: "", cls: "t-muted" };
  }
}

const FLOW = ["Registered", "Accepted", "Discovery", "Technical evaluation", "Proposal sent", "Closed"] as const;

export interface StageStep {
  label: string;
  state: "done" | "now" | "todo";
}

/** The stage tracker. Null when the deal never reached or has left the pipeline (rejected, expired). */
export function stageTrack(deal: Pick<RegistrationListItem, "status" | "stage">): StageStep[] | null {
  if (deal.status === "rejected" || deal.status === "expired") return null;
  const steps = FLOW.filter((step) => step !== "Discovery" || deal.stage === "Discovery");
  const last = steps.length - 1;
  let current: number;
  if (deal.status === "pending") current = 0;
  else if (deal.status === "won") current = steps.length;
  else if (deal.status === "lost") current = last;
  else current = Math.max(0, steps.indexOf(deal.stage as (typeof FLOW)[number]));
  return steps.map((step, index) => ({
    label: index === last && deal.status === "won" ? "Closed won" : index === last && deal.status === "lost" ? "Closed lost" : step,
    state: index < current ? "done" : index === current ? "now" : "todo",
  }));
}

/** The manager the Register form preselects: the one covering the deal region, else the first. */
export function managerFor(managers: readonly ManagerOptionDto[], region: DealRegion): string {
  return (managers.find((m) => m.region === region) ?? managers.find((m) => m.region === "all") ?? managers[0])?.id ?? "";
}
