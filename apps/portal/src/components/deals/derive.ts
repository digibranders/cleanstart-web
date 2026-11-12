import type { Deal, DealStatus, ProductName } from "@/data/deals";
import type { BadgeTone } from "../ui/badge";
import { addDays, daysBetween, daysLeft, fmtLong, fmtShort, PROTECTION_DAYS, plural, TODAY } from "./dates";

/** CleanStart reviews a registration within this many days. */
export const OVER_TARGET_DAYS = 2;

export const PRODUCT_SHORT: Record<ProductName, string> = {
  "CleanStart Images": "Images",
  "Clean Libraries": "Libraries",
  CleanSight: "CleanSight",
};

export const sameCustomer = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

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

export const statusTone = (status: DealStatus): BadgeTone => status.toLowerCase() as BadgeTone;

/** ISO date the current review started: the first submission, or the latest resubmission. */
export const reviewSince = (deal: Deal): string => deal.resubmittedOn ?? deal.registered;

export const waitDays = (deal: Deal): number => daysBetween(reviewSince(deal), TODAY);

export const acceptedOn = (deal: Deal): string | undefined =>
  deal.protectionEnd ? addDays(deal.protectionEnd, -(PROTECTION_DAYS - 1)) : undefined;

export interface ProtectionView {
  until: string;
  left: string;
  cls: string;
}

/** The "Protection" cell: waiting time, protected-until date, or the closing date, depending on status. */
export function protectionView(deal: Deal, mode: "deals" | "overview"): ProtectionView {
  switch (deal.status) {
    case "Pending": {
      if (deal.resubmittedOn === TODAY) return { until: "Resent today", left: "", cls: "t-muted" };
      const days = waitDays(deal);
      const late = days > OVER_TARGET_DAYS;
      return {
        until: days === 0 ? "Sent today" : `Waiting ${plural(days, "day")}`,
        left: mode === "deals" && late ? "over 2-day target" : "",
        cls: late ? "t-amber" : "t-muted",
      };
    }
    case "Accepted": {
      const end = deal.protectionEnd;
      if (!end) return { until: "", left: "", cls: "t-ink" };
      const days = daysLeft(end);
      return { until: fmtLong(end), left: `${days}d`, cls: days <= 14 ? "t-amber" : "t-ink" };
    }
    case "Won":
    case "Lost":
      return { until: `Closed ${fmtShort(deal.closedOn ?? deal.registered)}`, left: "", cls: "t-muted" };
    case "Expired":
      return { until: `Ended ${fmtShort(deal.closedOn ?? deal.registered)}`, left: "", cls: "t-muted" };
    case "Rejected":
      return { until: "Not protected", left: "", cls: "t-muted" };
  }
}

export interface Check {
  kind: "conflict" | "info" | "none";
  label: string;
  tone: BadgeTone;
  why: string;
  whyCls: string;
  /** The other partner's registration, when two partners claim the same customer and product. */
  rival?: Deal;
}

/** The approvals "Checks" column: a rival registration, the same customer under another product, or clear. */
export function checksFor(deal: Deal, all: readonly Deal[]): Check {
  const others = all.filter(
    (o) =>
      o.id !== deal.id && sameCustomer(o.customer, deal.customer) && (o.status === "Pending" || o.status === "Accepted"),
  );
  const rival = others.find((o) => o.product === deal.product && o.partner !== deal.partner);
  if (rival) {
    let why: string;
    if (rival.status === "Accepted") {
      why = `${rival.partner} already holds this, protected until ${fmtLong(rival.protectionEnd ?? TODAY)}.`;
    } else if (deal.registered < rival.registered) {
      why = `${rival.partner} also registered it on ${fmtShort(rival.registered)}. ${firstWord(deal.partner)} was first.`;
    } else {
      why = `${rival.partner} registered it first, on ${fmtShort(rival.registered)}.`;
    }
    return { kind: "conflict", label: "Conflict", tone: "pending", why, whyCls: "why why-amber", rival };
  }
  const held = others.find((o) => o.partner === deal.partner && o.product !== deal.product && o.status === "Accepted");
  if (held?.protectionEnd) {
    return {
      kind: "info",
      label: "Same customer",
      tone: "violet",
      why: `${firstWord(deal.partner)} already holds ${held.product} here, until ${fmtLong(held.protectionEnd)}.`,
      whyCls: "why",
    };
  }
  return { kind: "none", label: "Clear", tone: "accepted", why: "", whyCls: "why" };
}

const FLOW = ["Registered", "Accepted", "Discovery", "Technical evaluation", "Proposal sent", "Closed"] as const;

export interface StageStep {
  label: string;
  state: "done" | "now" | "todo";
}

/** The stage tracker. Null when the deal never reached or has left the pipeline (rejected, expired). */
export function stageTrack(deal: Deal): StageStep[] | null {
  if (deal.status === "Rejected" || deal.status === "Expired") return null;
  const steps = FLOW.filter((step) => step !== "Discovery" || deal.stage === "Discovery");
  const last = steps.length - 1;
  let current: number;
  if (deal.status === "Pending") current = 0;
  else if (deal.status === "Won") current = steps.length;
  else if (deal.status === "Lost") current = last;
  else current = Math.max(0, steps.indexOf(deal.stage as (typeof FLOW)[number]));
  return steps.map((step, index) => ({
    label: index === last && deal.status === "Won" ? "Closed won" : index === last && deal.status === "Lost" ? "Closed lost" : step,
    state: index < current ? "done" : index === current ? "now" : "todo",
  }));
}
