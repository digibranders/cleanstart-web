import type { Product } from "@/components/ui/badge";
import { DEMO_TODAY } from "@/lib/demo-date";
import { createSlice } from "@/lib/slice";
import { appendAudit } from "./audit";

export type PartnerCategory = "Distributor" | "Channel partner" | "System integrator";
export type PartnerRegion = "India" | "Middle East" | "Elsewhere";
export type PartnerStatus = "Active" | "Onboarding" | "Inactive" | "Suspended";
export type PartnerDealStatus = "Pending" | "Accepted" | "Won" | "Lost" | "Rejected";
export type ApplicationStatus = "New" | "Approved" | "Declined";

export const CATEGORIES: readonly PartnerCategory[] = ["Distributor", "Channel partner", "System integrator"];
export const MANAGERS: readonly string[] = ["Farhan Qureshi", "Omar Nasser"];
export const STAFF_ACTOR = "Farhan Qureshi";

export interface PartnerPerson {
  name: string;
  role: string;
  last: string;
}

export interface PartnerDeal {
  customer: string;
  product: Product;
  when: string;
  status: PartnerDealStatus;
}

export interface Partner {
  id: string;
  name: string;
  domain: string;
  category: PartnerCategory;
  region: PartnerRegion;
  status: PartnerStatus;
  /** What the status was before access was suspended, so Restore puts it back. */
  statusBeforeSuspend?: PartnerStatus | undefined;
  users: number;
  pending: number;
  protected: number;
  won: number;
  last: string;
  since: string;
  agreement: string;
  admin: string;
  manager: string;
  hs: string;
  people: PartnerPerson[];
  deals: PartnerDeal[];
}

export interface Application {
  id: string;
  reference: string;
  company: string;
  domain: string;
  applicant: string;
  email?: string;
  role: string;
  phone?: string;
  category: PartnerCategory;
  region: PartnerRegion;
  submitted: string;
  reason: string;
  status: ApplicationStatus;
  declineReason?: string | undefined;
  /** Id of the partner created when the application was approved. */
  partnerId?: string | undefined;
}

export interface CompanyProfile {
  name: string;
  website: string;
  phone: string;
  address: string;
  about: string;
}

interface PartnersState {
  partners: Partner[];
  applications: Application[];
  /** The application submitted most recently on /apply, shown on /apply/done. */
  lastApplicationId: string | null;
  profile: CompanyProfile;
}

/** The board lists 21 partners but details only 10; the other 11 are active partners that are not modelled. */
export const UNLISTED_ACTIVE_PARTNERS = 11;
export const KESTREL_ID = "kestrel-systems";
export const QAMAR_ID = "qamar-solutions";

export const KESTREL_PROFILE: CompanyProfile = {
  name: "Kestrel Systems",
  website: "kestrelsystems.in",
  phone: "+91 80 4718 2290",
  address: "4th floor, Prestige Tech Park, Outer Ring Road, Bengaluru 560103",
  about:
    "Security reseller for banks, NBFCs and insurers in Karnataka and Maharashtra. Team of 12, with 3 cloud engineers.",
};

const person = (name: string, role: string, last: string): PartnerPerson => ({ name, role, last });
const deal = (customer: string, product: Product, when: string, status: PartnerDealStatus): PartnerDeal => ({
  customer,
  product,
  when,
  status,
});

const SEED_PARTNERS: Partner[] = [
  {
    id: "kestrel-systems",
    name: "Kestrel Systems",
    domain: "kestrelsystems.in",
    category: "Channel partner",
    region: "India",
    status: "Active",
    users: 4,
    pending: 2,
    protected: 3,
    won: 2,
    last: "2 hours ago",
    since: "12 Mar 2026",
    agreement: "v1.2, accepted 12 Mar 2026",
    admin: "Aditi Rao",
    manager: "Farhan Qureshi",
    hs: "91822044",
    people: [
      person("Aditi Rao", "Partner admin", "Now"),
      person("Karan Malhotra", "Sales", "Yesterday"),
      person("Sneha Iyer", "Technical", "2 Nov"),
      person("Vikram Sethi", "Sales", "Invited 5 Nov"),
    ],
    deals: [
      deal("Vardhan Capital", "Clean Libraries", "4 Nov", "Pending"),
      deal("Gulfway Freight", "CleanStart Images", "3 Nov", "Pending"),
      deal("Vardhan Capital", "CleanSight", "14 Oct", "Accepted"),
    ],
  },
  {
    id: "saffron-secure",
    name: "Saffron Secure",
    domain: "saffronsecure.com",
    category: "Distributor",
    region: "India",
    status: "Active",
    users: 9,
    pending: 1,
    protected: 6,
    won: 4,
    last: "Today",
    since: "4 Feb 2026",
    agreement: "v1.2, accepted 4 Feb 2026",
    admin: "Rahul Bhatia",
    manager: "Farhan Qureshi",
    hs: "91820117",
    people: [
      person("Rahul Bhatia", "Partner admin", "Today"),
      person("Ananya Kulkarni", "Sales", "Today"),
      person("Dev Khanna", "Technical", "3 Nov"),
    ],
    deals: [
      deal("Meridian Insurance", "CleanSight", "5 Nov", "Pending"),
      deal("Tejas Labs", "Clean Libraries", "4 Nov", "Accepted"),
      deal("Orbit Retail", "CleanStart Images", "20 Oct", "Won"),
    ],
  },
  {
    id: "arbor-cyber",
    name: "Arbor Cyber",
    domain: "arborcyber.ae",
    category: "System integrator",
    region: "Middle East",
    status: "Active",
    users: 5,
    pending: 1,
    protected: 2,
    won: 1,
    last: "Yesterday",
    since: "19 Apr 2026",
    agreement: "v1.2, accepted 19 Apr 2026",
    admin: "Layla Haddad",
    manager: "Omar Nasser",
    hs: "91823390",
    people: [
      person("Layla Haddad", "Partner admin", "Yesterday"),
      person("Tariq Mansour", "Technical", "4 Nov"),
      person("Rana Saleh", "Sales", "1 Nov"),
    ],
    deals: [
      deal("Gulfway Freight", "CleanStart Images", "5 Nov", "Pending"),
      deal("Coastline Telecom", "CleanStart Images", "3 Nov", "Rejected"),
      deal("Desert Rose Health", "CleanSight", "9 Sep", "Won"),
    ],
  },
  {
    id: "dunes-networks",
    name: "Dunes Networks",
    domain: "dunesnetworks.ae",
    category: "Channel partner",
    region: "Middle East",
    status: "Active",
    users: 3,
    pending: 0,
    protected: 4,
    won: 3,
    last: "5 Nov",
    since: "2 Jan 2026",
    agreement: "v1.1, accepted 2 Jan 2026",
    admin: "Faisal Rahman",
    manager: "Omar Nasser",
    hs: "91819002",
    people: [person("Faisal Rahman", "Partner admin", "5 Nov"), person("Mariam Yousef", "Sales", "5 Nov")],
    deals: [
      deal("Pearl Gulf Bank", "CleanSight", "5 Nov", "Accepted"),
      deal("Oasis Freight", "Clean Libraries", "12 Oct", "Accepted"),
    ],
  },
  {
    id: "harbourline-it",
    name: "Harbourline IT",
    domain: "harbourline.ae",
    category: "Distributor",
    region: "Middle East",
    status: "Active",
    users: 7,
    pending: 0,
    protected: 5,
    won: 1,
    last: "4 Nov",
    since: "28 Jan 2026",
    agreement: "v1.2, accepted 28 Jan 2026",
    admin: "Omar Siddiqui",
    manager: "Omar Nasser",
    hs: "91819874",
    people: [person("Omar Siddiqui", "Partner admin", "4 Nov"), person("Hana Qasim", "Sales", "2 Nov")],
    deals: [deal("Gulfstar Energy", "CleanStart Images", "30 Oct", "Accepted")],
  },
  {
    id: "vyom-digital",
    name: "Vyom Digital",
    domain: "vyomdigital.in",
    category: "System integrator",
    region: "India",
    status: "Active",
    users: 6,
    pending: 0,
    protected: 3,
    won: 2,
    last: "2 Nov",
    since: "9 Feb 2026",
    agreement: "v1.2, accepted 9 Feb 2026",
    admin: "Ishaan Verma",
    manager: "Farhan Qureshi",
    hs: "91820540",
    people: [person("Ishaan Verma", "Partner admin", "2 Nov"), person("Kavya Nair", "Technical", "1 Nov")],
    deals: [
      deal("Sahyadri Bank", "CleanSight", "28 Oct", "Accepted"),
      deal("Nirmala Pharma", "Clean Libraries", "2 Sep", "Won"),
    ],
  },
  {
    id: "coralbay-technologies",
    name: "Coralbay Technologies",
    domain: "coralbay.ae",
    category: "Channel partner",
    region: "Middle East",
    status: "Active",
    users: 2,
    pending: 0,
    protected: 1,
    won: 0,
    last: "3 Nov",
    since: "15 Jun 2026",
    agreement: "v1.2, accepted 15 Jun 2026",
    admin: "Nadia Karim",
    manager: "Omar Nasser",
    hs: "91824415",
    people: [person("Nadia Karim", "Partner admin", "3 Nov")],
    deals: [deal("Marina Hotels", "CleanStart Images", "22 Oct", "Accepted")],
  },
  {
    id: "meghdoot-systems",
    name: "Meghdoot Systems",
    domain: "meghdoot.in",
    category: "Channel partner",
    region: "India",
    status: "Onboarding",
    users: 1,
    pending: 0,
    protected: 0,
    won: 0,
    last: "30 Oct",
    since: "28 Oct 2026",
    agreement: "v1.2, accepted 30 Oct 2026",
    admin: "Arjun Pillai",
    manager: "Farhan Qureshi",
    hs: "91826021",
    people: [person("Arjun Pillai", "Partner admin", "30 Oct")],
    deals: [],
  },
  {
    id: "qamar-solutions",
    name: "Qamar Solutions",
    domain: "qamarsolutions.ae",
    category: "Channel partner",
    region: "Middle East",
    status: "Onboarding",
    users: 2,
    pending: 0,
    protected: 0,
    won: 0,
    last: "28 Oct",
    since: "27 Oct 2026",
    agreement: "Not accepted yet",
    admin: "Yasmin Haddad",
    manager: "Omar Nasser",
    hs: "91826110",
    people: [
      person("Yasmin Haddad", "Partner admin", "Invited 27 Oct"),
      person("Zaid Omar", "Sales", "Invited 27 Oct"),
    ],
    deals: [],
  },
  {
    id: "ironleaf-consulting",
    name: "Ironleaf Consulting",
    domain: "ironleaf.in",
    category: "System integrator",
    region: "India",
    status: "Inactive",
    users: 2,
    pending: 0,
    protected: 0,
    won: 0,
    last: "2 Aug",
    since: "6 May 2026",
    agreement: "v1.1, accepted 6 May 2026",
    admin: "Manish Rao",
    manager: "Farhan Qureshi",
    hs: "91822760",
    people: [person("Manish Rao", "Partner admin", "2 Aug")],
    deals: [],
  },
];

const SEED_APPLICATIONS: Application[] = [
  {
    id: "a1",
    reference: "APP-2611-0042",
    company: "Tidewater Infosec",
    domain: "tidewaterinfosec.in",
    applicant: "Neha Joshi",
    email: "neha.joshi@tidewaterinfosec.in",
    role: "CTO",
    phone: "+91 98200 41377",
    category: "Channel partner",
    region: "India",
    submitted: "2 Nov 2026",
    reason:
      "We resell security tooling to mid-size banks and NBFCs in Pune and Mumbai, and customers are asking for hardened base images.",
    status: "New",
  },
  {
    id: "a2",
    reference: "APP-2611-0043",
    company: "Falcon Ridge IT",
    domain: "falconridge.ae",
    applicant: "Sameer Al Harthy",
    role: "Managing Director",
    category: "Distributor",
    region: "Middle East",
    submitted: "4 Nov 2026",
    reason:
      "Value-added distributor across Oman and the UAE with 30 resellers; looking to add container security to our portfolio.",
    status: "New",
  },
  {
    id: "a3",
    reference: "APP-2611-0044",
    company: "Lattice Cloud Services",
    domain: "latticecloud.in",
    applicant: "Ritu Menon",
    role: "Head of Alliances",
    category: "System integrator",
    region: "India",
    submitted: "5 Nov 2026",
    reason: "We run Kubernetes platform engagements for insurers and want CleanStart Images as the default base layer.",
    status: "New",
  },
];

export const partnersSlice = createSlice<PartnersState>("partners", {
  partners: SEED_PARTNERS,
  applications: SEED_APPLICATIONS,
  lastApplicationId: null,
  profile: KESTREL_PROFILE,
});

export const FREE_EMAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "rediffmail.com",
  "yandex.com",
  "gmx.com",
];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Lower-cased domain of a valid email, or an empty string. */
export function emailDomain(value: string): string {
  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? (email.split("@")[1] ?? "") : "";
}

export function isFreeEmail(value: string): boolean {
  return FREE_EMAIL_DOMAINS.includes(emailDomain(value));
}

/** "https://www.Example.com/path" becomes "example.com". */
export function normaliseDomain(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0] ?? ""
  );
}

export function findPartnerByDomain(partners: readonly Partner[], domain: string): Partner | undefined {
  return domain ? partners.find((p) => normaliseDomain(p.domain) === domain) : undefined;
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const kebab = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function uniquePartnerId(partners: readonly Partner[], name: string): string {
  const base = kebab(name) || "partner";
  let id = base;
  for (let n = 2; partners.some((p) => p.id === id); n += 1) id = `${base}-${n}`;
  return id;
}

export function managerForRegion(region: PartnerRegion): string {
  return region === "India" ? "Farhan Qureshi" : "Omar Nasser";
}

function newPartner(
  partners: readonly Partner[],
  input: { name: string; domain: string; category: PartnerCategory; region: PartnerRegion; admin: string },
): Partner {
  return {
    id: uniquePartnerId(partners, input.name),
    name: input.name,
    domain: input.domain,
    category: input.category,
    region: input.region,
    status: "Onboarding",
    users: 1,
    pending: 0,
    protected: 0,
    won: 0,
    last: "Invited today",
    since: DEMO_TODAY,
    agreement: "Not accepted yet",
    admin: input.admin,
    manager: managerForRegion(input.region),
    hs: "Not created yet",
    people: [person(input.admin, "Partner admin", "Invited today")],
    deals: [],
  };
}

export interface ApplicationInput {
  company: string;
  website: string;
  applicant: string;
  role: string;
  email: string;
  phone: string;
  category: PartnerCategory;
  region: PartnerRegion;
  reason: string;
}

/** Stores a new application at the top of the queue. Re-applying with the same email refreshes the open one. */
export function submitApplication(input: ApplicationInput): Application {
  const state = partnersSlice.get();
  const email = input.email.trim();
  const fields = {
    company: input.company.trim(),
    domain: normaliseDomain(input.website) || emailDomain(email),
    applicant: input.applicant.trim(),
    email,
    role: input.role.trim(),
    phone: input.phone.trim(),
    category: input.category,
    region: input.region,
    submitted: DEMO_TODAY,
    reason: input.reason.trim(),
  };
  const open = state.applications.find(
    (a) => a.status === "New" && a.email?.toLowerCase() === email.toLowerCase(),
  );

  let application: Application;
  let applications: Application[];
  if (open) {
    application = { ...open, ...fields };
    applications = [application, ...state.applications.filter((a) => a.id !== open.id)];
  } else {
    const next = state.applications.reduce((max, a) => Math.max(max, Number(a.reference.slice(-4))), 0) + 1;
    application = {
      ...fields,
      id: `app-${next}`,
      reference: `APP-2611-${String(next).padStart(4, "0")}`,
      status: "New",
    };
    applications = [application, ...state.applications];
  }
  partnersSlice.set({ ...state, applications, lastApplicationId: application.id });
  appendAudit({
    actor: application.applicant,
    action: "Submitted partner application",
    target: application.company,
    detail: `${application.category}, ${application.region}`,
    source: "Portal",
  });
  return application;
}

/** Approving creates the partner company in Onboarding and invites the applicant as its partner admin. */
export function approveApplication(id: string): Partner | null {
  const state = partnersSlice.get();
  const application = state.applications.find((a) => a.id === id);
  if (!application || application.status !== "New") return null;
  const partner = newPartner(state.partners, {
    name: application.company,
    domain: application.domain,
    category: application.category,
    region: application.region,
    admin: application.applicant,
  });
  partnersSlice.set({
    ...state,
    partners: [...state.partners, partner],
    applications: state.applications.map((a) =>
      a.id === id ? { ...a, status: "Approved", partnerId: partner.id, declineReason: undefined } : a,
    ),
  });
  appendAudit({
    actor: STAFF_ACTOR,
    action: "Approved partner application",
    target: application.company,
    detail: `Invite sent to ${application.applicant}`,
    source: "Portal",
  });
  return partner;
}

export function declineApplication(id: string, reason: string): void {
  const state = partnersSlice.get();
  const application = state.applications.find((a) => a.id === id);
  if (!application || application.status !== "New") return;
  partnersSlice.set({
    ...state,
    applications: state.applications.map((a) =>
      a.id === id ? { ...a, status: "Declined", declineReason: reason.trim() } : a,
    ),
  });
  appendAudit({
    actor: STAFF_ACTOR,
    action: "Declined partner application",
    target: application.company,
    detail: reason.trim(),
    source: "Portal",
  });
}

/** Undo a decision. An approval also removes the partner it created, unless the partner has moved on. */
export function reopenApplication(id: string): void {
  const state = partnersSlice.get();
  const application = state.applications.find((a) => a.id === id);
  if (!application || application.status === "New") return;
  const created = state.partners.find((p) => p.id === application.partnerId);
  const removable = created !== undefined && created.status === "Onboarding" && created.agreement === "Not accepted yet";
  partnersSlice.set({
    ...state,
    partners: removable ? state.partners.filter((p) => p.id !== created.id) : state.partners,
    applications: state.applications.map((a) =>
      a.id === id ? { ...a, status: "New", partnerId: undefined, declineReason: undefined } : a,
    ),
  });
  appendAudit({
    actor: STAFF_ACTOR,
    action: "Reopened partner application",
    target: application.company,
    detail: application.status === "Approved" ? "Approval undone, invite withdrawn" : "Decline undone",
    source: "Portal",
  });
}

export interface NewPartnerInput {
  name: string;
  website: string;
  category: PartnerCategory;
  region: PartnerRegion;
  admin: string;
  email: string;
  sendInvite: boolean;
}

export function addPartner(input: NewPartnerInput): Partner {
  const state = partnersSlice.get();
  const email = input.email.trim();
  const admin = input.admin.trim() || email;
  const partner = newPartner(state.partners, {
    name: input.name.trim(),
    domain: normaliseDomain(input.website) || emailDomain(email),
    category: input.category,
    region: input.region,
    admin,
  });
  const added: Partner = input.sendInvite
    ? partner
    : { ...partner, last: "Not invited yet", people: [person(admin, "Partner admin", "Not invited yet")] };
  partnersSlice.set({ ...state, partners: [...state.partners, added] });
  appendAudit({
    actor: STAFF_ACTOR,
    action: input.sendInvite ? "Added partner and sent invite" : "Added partner",
    target: added.name,
    detail: `${added.category}, ${added.region}. Partner admin ${admin}`,
    source: "Portal",
  });
  return added;
}

function updatePartner(id: string, change: (p: Partner) => Partner): Partner | undefined {
  const state = partnersSlice.get();
  const current = state.partners.find((p) => p.id === id);
  if (!current) return undefined;
  const next = change(current);
  partnersSlice.set({ ...state, partners: state.partners.map((p) => (p.id === id ? next : p)) });
  return next;
}

export function setPartnerManager(id: string, manager: string): void {
  const before = partnersSlice.get().partners.find((p) => p.id === id);
  const after = updatePartner(id, (p) => ({ ...p, manager }));
  if (before && after && before.manager !== manager) {
    appendAudit({
      actor: STAFF_ACTOR,
      action: "Changed partner manager",
      target: after.name,
      detail: `${before.manager} to ${manager}`,
      source: "Portal",
    });
  }
}

export function setPartnerCategory(id: string, category: PartnerCategory): void {
  const before = partnersSlice.get().partners.find((p) => p.id === id);
  const after = updatePartner(id, (p) => ({ ...p, category }));
  if (before && after && before.category !== category) {
    appendAudit({
      actor: STAFF_ACTOR,
      action: "Changed partner category",
      target: after.name,
      detail: `${before.category} to ${category}`,
      source: "Portal",
    });
  }
}

export function setPartnerSuspended(id: string, suspended: boolean): void {
  const after = updatePartner(id, (p) => {
    if (suspended) {
      return p.status === "Suspended" ? p : { ...p, status: "Suspended", statusBeforeSuspend: p.status };
    }
    return p.status === "Suspended" ? { ...p, status: p.statusBeforeSuspend ?? "Active", statusBeforeSuspend: undefined } : p;
  });
  if (after) {
    appendAudit({
      actor: STAFF_ACTOR,
      action: suspended ? "Suspended partner access" : "Restored partner access",
      target: after.name,
      source: "Portal",
    });
  }
}

/** Number of people at the partner who still have an open invite. */
export function openInvites(partner: Partner): number {
  return partner.people.filter((p) => p.last.startsWith("Invited")).length;
}

export function resendInvites(id: string): number {
  const partner = partnersSlice.get().partners.find((p) => p.id === id);
  if (!partner) return 0;
  const count = openInvites(partner);
  if (count > 0) {
    appendAudit({
      actor: STAFF_ACTOR,
      action: "Resent invites",
      target: partner.name,
      detail: `${count} ${count === 1 ? "person" : "people"}`,
      source: "Portal",
    });
  }
  return count;
}

/** The invited partner admin accepts the agreement: the company records the version and date. */
export function acceptPartnerAgreement(id: string, personName: string): void {
  const after = updatePartner(id, (p) => ({
    ...p,
    agreement: `v1.2, accepted ${DEMO_TODAY}`,
    last: "Today",
    people: p.people.map((u) => (u.name === personName ? { ...u, last: "Today" } : u)),
  }));
  if (after) {
    appendAudit({
      actor: personName,
      action: "Accepted partner agreement",
      target: after.name,
      detail: "Version 1.2",
      source: "Portal",
    });
  }
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  partnersSlice.set((state) => ({ ...state, profile }));
  appendAudit({
    actor: "Aditi Rao",
    action: "Updated company profile",
    target: "Kestrel Systems",
    source: "Portal",
  });
}
