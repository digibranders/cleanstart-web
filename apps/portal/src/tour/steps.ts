import { ROUTES } from "@/lib/routes";

export type TourGroup = "Getting in" | "Partner" | "CleanStart staff";

export interface TourStep {
  id: string;
  group: TourGroup;
  /** Short name in the walkthrough list. */
  label: string;
  /** Who is looking at the screen, shown under the label. */
  role: string;
  path: string;
  /** Value of the data-tour attribute to spotlight. Without it the popover is centred. */
  anchor?: string;
  title: string;
  description: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "sign-in",
    group: "Getting in",
    label: "Sign in",
    role: "Anyone",
    path: ROUTES.signIn,
    anchor: "signin-form",
    title: "Signing in",
    description:
      "Partners sign in with a company email and password, or with Google or Microsoft. A two-step code follows. The two shortcut buttons under the form open the portal as a partner or as CleanStart staff, so nobody needs credentials for this review.",
  },
  {
    id: "apply",
    group: "Getting in",
    label: "Apply to become a partner",
    role: "A company that is not a partner yet",
    path: ROUTES.apply,
    anchor: "apply-email",
    title: "There is no open sign-up",
    description:
      "A company applies here. A company email is required, free mail is blocked, and an address from a company that is already a partner is sent to request access instead. Fill the form in and submit it to carry on with a live application.",
  },
  {
    id: "apply-done",
    group: "Getting in",
    label: "Application received",
    role: "The applicant",
    path: ROUTES.applyDone,
    anchor: "apply-done",
    title: "What the applicant sees next",
    description:
      "The applicant is told that a CleanStart partner manager will review the application. Nothing in the portal opens for them until it is approved.",
  },
  {
    id: "applications",
    group: "Getting in",
    label: "Review applications",
    role: "CleanStart partner manager",
    path: `${ROUTES.admin.partners}?tab=applications`,
    anchor: "application-approve",
    title: "Applications wait on the Partners screen",
    description:
      "A partner manager reviews each application on the Applications tab. Approving sends an invite, and the applicant becomes the partner admin of their company. CleanStart can also add a partner directly.",
  },
  {
    id: "invite",
    group: "Getting in",
    label: "Accept the invite",
    role: "The new partner admin",
    path: ROUTES.acceptInvite,
    anchor: "invite-rules",
    title: "Setting a password",
    description:
      "The invited person chooses a password that has at least 8 characters, a letter, a number and a special character, then accepts the partner agreement.",
  },
  {
    id: "welcome",
    group: "Getting in",
    label: "First login",
    role: "New partner admin",
    path: ROUTES.partner.welcome,
    anchor: "welcome-checklist",
    title: "A new partner starts with a checklist",
    description:
      "A company with no deals yet sees the first steps and helpful empty states, not blank tables.",
  },
  {
    id: "overview",
    group: "Partner",
    label: "Overview",
    role: "Partner admin",
    path: ROUTES.partner.overview,
    anchor: "overview-kpis",
    title: "The partner's home screen",
    description:
      "Deals waiting for review, protected deals and deals about to expire, with the items that need attention listed below.",
  },
  {
    id: "register",
    group: "Partner",
    label: "Register a deal",
    role: "Partner",
    path: ROUTES.partner.newDeal,
    anchor: "reg-customer",
    title: "Registering a deal",
    description:
      "Type the customer's name. When the customer is already known, the form lists the partner's own deals there before anything is submitted. Choose the products and submit to send it for approval.",
  },
  {
    id: "deals",
    group: "Partner",
    label: "Deals and status",
    role: "Partner",
    path: ROUTES.partner.deals,
    anchor: "deals-table",
    title: "Every registration and its status",
    description:
      "A new registration starts as Pending. After CleanStart decides, the status changes here. A rejected deal shows the reason, with a way to fix it and resubmit.",
  },
  {
    id: "approvals",
    group: "CleanStart staff",
    label: "Approval queue",
    role: "CleanStart partner manager",
    path: ROUTES.admin.approvals,
    anchor: "approvals-queue",
    title: "Registrations wait for a decision",
    description:
      "Each registration goes to the partner manager for its region, with a 2 day review target. The count in the sidebar is the number still waiting.",
  },
  {
    id: "conflict",
    group: "CleanStart staff",
    label: "Conflicts",
    role: "CleanStart partner manager",
    path: ROUTES.admin.approvals,
    anchor: "approvals-conflict",
    title: "Two partners, one customer",
    description:
      "When two partners register the same customer, the row is marked as a conflict so a person decides it on purpose.",
  },
  {
    id: "accept",
    group: "CleanStart staff",
    label: "Accept or reject",
    role: "CleanStart partner manager",
    path: ROUTES.admin.approvals,
    anchor: "approvals-accept",
    title: "Accepting a registration",
    description:
      "Accepting creates the deal in HubSpot, starts 90 days of protection and emails the partner. Rejecting asks for a reason that the partner can read. Try it, then open the partner's Deals screen to see the change.",
  },
  {
    id: "deal-detail",
    group: "Partner",
    label: "Deal detail",
    role: "Partner",
    path: ROUTES.partner.deal("vardhan-capital"),
    anchor: "deal-stage",
    title: "HubSpot owns the stage",
    description:
      "The portal shows the stage that HubSpot reports, the protection end date and the conversation with the partner manager. The portal itself owns the 90 day expiry.",
  },
  {
    id: "documents",
    group: "Partner",
    label: "Document library",
    role: "Partner",
    path: ROUTES.partner.documents,
    anchor: "docs-library",
    title: "Partner-only material",
    description:
      "Videos, datasheets, decks and guides, filtered by product and type. A partner only sees what its audience allows. These files are stored in the portal and never on the public website.",
  },
  {
    id: "admin-documents",
    group: "CleanStart staff",
    label: "Manage documents",
    role: "CleanStart marketing",
    path: ROUTES.admin.documents,
    anchor: "admin-docs-upload",
    title: "Who can open each file",
    description:
      "Upload a file and choose its audience: all partners, a category or named partners. The table shows how often each one is opened.",
  },
  {
    id: "team",
    group: "Partner",
    label: "Team and access",
    role: "Partner admin",
    path: ROUTES.partner.team,
    anchor: "team-members",
    title: "A partner admin manages their own people",
    description:
      "Invite colleagues, approve access requests from people with the same company email domain, and remove people who leave.",
  },
  {
    id: "account",
    group: "Partner",
    label: "Account security",
    role: "Any partner user",
    path: ROUTES.partner.account,
    anchor: "account-2fa",
    title: "Two-step verification",
    description:
      "Every person manages their own password and two-step code here. The password rule is the same as on the invite screen.",
  },
  {
    id: "reports",
    group: "CleanStart staff",
    label: "Reports",
    role: "CleanStart partner manager",
    path: ROUTES.admin.reports,
    anchor: "reports-kpis",
    title: "How the programme is doing",
    description:
      "Registrations and acceptance by partner, region and product, with lists of partners that need a follow-up.",
  },
  {
    id: "staff",
    group: "CleanStart staff",
    label: "Staff and roles",
    role: "CleanStart administrator",
    path: ROUTES.admin.team,
    anchor: "staff-table",
    title: "Who at CleanStart can do what",
    description:
      "Partner managers, marketing and administrators each get the access they need, and no more.",
  },
  {
    id: "audit",
    group: "CleanStart staff",
    label: "Audit log",
    role: "CleanStart administrator",
    path: ROUTES.admin.audit,
    anchor: "audit-table",
    title: "A record of every change",
    description:
      "Approvals, invites, uploads and role changes are recorded with who did them. Anything you did during this walkthrough is listed at the top.",
  },
];
