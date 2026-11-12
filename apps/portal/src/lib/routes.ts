import type { IconName } from "@/components/icon-paths";

export const ROUTES = {
  signIn: "/sign-in",
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
  },
} as const;

export type PortalKind = "partner" | "admin";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** Key into the live nav counts, if the item shows a count. */
  count?: "approvals";
}

export const PARTNER_NAV: readonly NavItem[] = [
  { label: "Overview", href: ROUTES.partner.overview, icon: "dash" },
  { label: "Deals", href: ROUTES.partner.deals, icon: "deals" },
  { label: "Register deal", href: ROUTES.partner.newDeal, icon: "reg" },
  { label: "Documents", href: ROUTES.partner.documents, icon: "docs" },
  { label: "Team", href: ROUTES.partner.team, icon: "team" },
  { label: "Company", href: ROUTES.partner.company, icon: "bld" },
];

export const ADMIN_NAV: readonly NavItem[] = [
  { label: "Deal approvals", href: ROUTES.admin.approvals, icon: "approve", count: "approvals" },
  { label: "Partners", href: ROUTES.admin.partners, icon: "bld" },
  { label: "Documents", href: ROUTES.admin.documents, icon: "docs" },
  { label: "Reports", href: ROUTES.admin.reports, icon: "chart" },
  { label: "Team", href: ROUTES.admin.team, icon: "team" },
  { label: "Audit log", href: ROUTES.admin.audit, icon: "clk" },
];
