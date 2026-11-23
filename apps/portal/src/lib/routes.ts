import type { IconName } from "@/components/icon-paths";
import { type Action, can } from "@/server/auth/policies";
import type { Viewer } from "@/server/auth/types";

export const ROUTES = {
  signIn: "/sign-in",
  resetPassword: "/reset-password",
  apply: "/apply",
  applyDone: "/apply/done",
  acceptInvite: "/accept-invite",
  partner: {
    welcome: "/partner/welcome",
    overview: "/partner/overview",
    deals: "/partner/deals",
    newDeal: "/partner/deals/new",
    deal: (id: string): string => `/partner/deals/${id}`,
    documents: "/partner/documents",
    team: "/partner/team",
    company: "/partner/company",
    account: "/partner/account",
  },
  admin: {
    approvals: "/admin/approvals",
    partners: "/admin/partners",
    documents: "/admin/documents",
    reports: "/admin/reports",
    team: "/admin/team",
    audit: "/admin/audit",
    account: "/admin/account",
  },
} as const;

export type PortalKind = "partner" | "admin";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** The permission that shows this item: the same action the page itself checks. */
  action: Action;
  /** Key into the live nav counts, if the item shows a count. */
  count?: "approvals";
}

export const PARTNER_NAV: readonly NavItem[] = [
  { label: "Overview", href: ROUTES.partner.overview, icon: "dash", action: "overview.read" },
  { label: "Deals", href: ROUTES.partner.deals, icon: "deals", action: "registration.read" },
  { label: "Register deal", href: ROUTES.partner.newDeal, icon: "reg", action: "registration.create" },
  { label: "Documents", href: ROUTES.partner.documents, icon: "docs", action: "document.read" },
  { label: "Team", href: ROUTES.partner.team, icon: "team", action: "team.read" },
  { label: "Company", href: ROUTES.partner.company, icon: "bld", action: "partner.read" },
];

export const ADMIN_NAV: readonly NavItem[] = [
  { label: "Deals", href: ROUTES.admin.approvals, icon: "approve", action: "registration.read_queue", count: "approvals" },
  { label: "Partners", href: ROUTES.admin.partners, icon: "bld", action: "partner.read" },
  { label: "Documents", href: ROUTES.admin.documents, icon: "docs", action: "document.upload" },
  { label: "Reports", href: ROUTES.admin.reports, icon: "chart", action: "report.read" },
  { label: "Team", href: ROUTES.admin.team, icon: "team", action: "staff.read" },
  { label: "Audit log", href: ROUTES.admin.audit, icon: "clk", action: "audit.read" },
];

/** The sidebar items this viewer may open, in order. */
export function navFor(viewer: Viewer): NavItem[] {
  const items = viewer.kind === "partner" ? PARTNER_NAV : ADMIN_NAV;
  return items.filter((item) => can(viewer, item.action));
}

/** The href of the sidebar item for the page being shown: the longest match, so /partner/deals/new lights only Register deal. */
export function activeNavHref(nav: readonly NavItem[], pathname: string): string | null {
  const path = pathname.startsWith(ROUTES.partner.welcome) ? ROUTES.partner.overview : pathname;
  const match = [...nav].sort((a, b) => b.href.length - a.href.length).find((n) => path === n.href || path.startsWith(`${n.href}/`));
  return match?.href ?? null;
}

/** What this viewer can search, from the pages in their sidebar: marketing finds documents, never partners or deals. */
export function searchNouns(kind: PortalKind, nav: readonly NavItem[]): string[] {
  const has = (href: string): boolean => nav.some((item) => item.href === href);
  const nouns =
    kind === "partner"
      ? [has(ROUTES.partner.deals) && "deals", has(ROUTES.partner.documents) && "documents"]
      : [has(ROUTES.admin.partners) && "partners", has(ROUTES.admin.approvals) && "deals", has(ROUTES.admin.documents) && "documents"];
  return nouns.filter((noun): noun is string => noun !== false);
}

/** "a", "a and b", "a, b and c". */
export function joinWords(words: readonly string[]): string {
  return words.length < 2 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
