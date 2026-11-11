import { appendAudit } from "@/data/audit";
import { addDays, fmtLong, fmtShort, NOW_TIME, PROTECTION_DAYS, TODAY } from "@/components/deals/dates";
import { KESTREL, STAFF } from "@/components/shell/personas";
import { createSlice } from "@/lib/slice";

export const PRODUCTS = ["CleanStart Images", "Clean Libraries", "CleanSight"] as const;
export type ProductName = (typeof PRODUCTS)[number];
export type DealStatus = "Pending" | "Accepted" | "Rejected" | "Expired" | "Won" | "Lost";
export type Region = "India" | "Middle East";
export type ManagerName = "Farhan Qureshi" | "Omar Nasser";

export interface DealContact {
  name: string;
  role?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface DealMessage {
  id: string;
  who: string;
  org: string;
  initials: string;
  /** True when the partner wrote it. */
  self: boolean;
  when: string;
  text: string;
  /** Written by an accept or reject decision, so undoing the decision removes it. */
  auto?: true | undefined;
}

export interface DealEvent {
  when: string;
  text: string;
  by: string;
  source: "CRM" | "Portal" | "System";
  auto?: true | undefined;
}

export interface Deal {
  id: string;
  customer: string;
  website?: string | undefined;
  partner: string;
  partnerCategory: string;
  product: ProductName;
  region: Region;
  manager: ManagerName;
  registeredBy?: string | undefined;
  /** ISO date the registration was first submitted. */
  registered: string;
  registeredTime?: string | undefined;
  /** ISO date of the latest resubmission after a rejection. */
  resubmittedOn?: string | undefined;
  status: DealStatus;
  stage: string;
  /** ISO date, last day of protection. */
  protectionEnd?: string | undefined;
  /** ISO date a deal was won, lost or expired. */
  closedOn?: string | undefined;
  /** ISO date and person of the accept or reject decision. */
  decidedOn?: string | undefined;
  decidedBy?: string | undefined;
  /** True for a decision taken in this session, so the approvals queue keeps the row and offers Undo. */
  decidedLive?: true | undefined;
  rejectionReason?: string | undefined;
  crmRef?: string | undefined;
  crmSynced?: string | undefined;
  extensionRequested?: true | undefined;
  notes?: string | undefined;
  contacts: DealContact[];
  thread: DealMessage[];
  history: DealEvent[];
}

const FARHAN = "Farhan Qureshi";
const OMAR = "Omar Nasser";
const ADITI = "Aditi Rao";
const KARAN = "Karan Malhotra";
const KESTREL_CATEGORY = "Channel partner";

const registered = (when: string, by: string): DealEvent => ({ when, text: "Registered", by, source: "Portal" });
const accepted = (when: string, end: string, by: string): DealEvent => ({
  when,
  text: `Accepted, protected until ${end}`,
  by,
  source: "Portal",
});
const closed = (when: string, text: string): DealEvent => ({ when, text, by: FARHAN, source: "CRM" });

const SEED: Deal[] = [
  {
    id: "vardhan-capital-libraries",
    customer: "Vardhan Capital",
    website: "vardhancapital.in",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "Clean Libraries",
    region: "India",
    manager: FARHAN,
    registeredBy: ADITI,
    registered: "2026-11-04",
    status: "Pending",
    stage: "Awaiting review",
    contacts: [
      { name: "Rohan Mehta", role: "Head of Security", email: "rohan.mehta@vardhancapital.in", phone: "+91 98204 31786" },
    ],
    thread: [],
    history: [registered("4 Nov 2026", ADITI)],
  },
  {
    id: "gulfway-freight",
    customer: "Gulfway Freight",
    website: "gulfwayfreight.ae",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "CleanStart Images",
    region: "Middle East",
    manager: OMAR,
    registeredBy: KARAN,
    registered: "2026-11-03",
    status: "Pending",
    stage: "Awaiting review",
    contacts: [{ name: "Yusuf Al Amiri" }],
    thread: [],
    history: [registered("3 Nov 2026", KARAN)],
  },
  {
    id: "tejas-health-network",
    customer: "Tejas Health Network",
    website: "tejashealth.in",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "CleanSight",
    region: "India",
    manager: FARHAN,
    registeredBy: ADITI,
    registered: "2026-08-17",
    status: "Accepted",
    stage: "Technical evaluation",
    protectionEnd: "2026-11-15",
    decidedOn: "2026-08-18",
    decidedBy: FARHAN,
    crmRef: "HS-47866",
    contacts: [],
    thread: [],
    history: [accepted("18 Aug 2026", "15 Nov 2026", FARHAN), registered("17 Aug 2026", ADITI)],
  },
  {
    id: "al-noor-logistics",
    customer: "Al Noor Logistics",
    website: "alnoorlogistics.ae",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "Clean Libraries",
    region: "Middle East",
    manager: OMAR,
    registeredBy: KARAN,
    registered: "2026-09-22",
    status: "Accepted",
    stage: "Discovery",
    protectionEnd: "2026-12-21",
    decidedOn: "2026-10-31",
    decidedBy: OMAR,
    crmRef: "HS-48201",
    contacts: [],
    thread: [],
    history: [accepted("23 Sep 2026", "21 Dec 2026", OMAR), registered("22 Sep 2026", KARAN)],
  },
  {
    id: "vardhan-capital",
    customer: "Vardhan Capital",
    website: "vardhancapital.in",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "CleanSight",
    region: "India",
    manager: FARHAN,
    registeredBy: ADITI,
    registered: "2026-10-14",
    registeredTime: "11:42",
    status: "Accepted",
    stage: "Proposal sent",
    protectionEnd: "2027-01-12",
    decidedOn: "2026-10-15",
    decidedBy: FARHAN,
    crmRef: "HS-48213",
    crmSynced: "Synced 6 Nov, 14:02",
    notes: "Security team wants vulnerability detection across the payments cluster ahead of the Q1 audit.",
    contacts: [
      { name: "Rohan Mehta", role: "Head of Security", email: "rohan.mehta@vardhancapital.in", phone: "+91 98204 31786" },
      { name: "Priya Shetty", role: "Platform Engineering lead" },
    ],
    thread: [
      {
        id: "vardhan-capital-m1",
        who: ADITI,
        org: KESTREL.org,
        initials: "AR",
        self: true,
        when: "29 Oct, 10:12",
        text: "Their CISO wants a reference customer in banking before the proposal review. Do you have one we can share?",
      },
      {
        id: "vardhan-capital-m2",
        who: FARHAN,
        org: "CleanStart",
        initials: "FQ",
        self: false,
        when: "29 Oct, 15:40",
        text: "Yes. I will set up a reference call with one of our bank customers next week and send you two dates.",
      },
    ],
    history: [
      closed("6 Nov 2026", "Stage moved to Proposal sent"),
      closed("18 Oct 2026", "Stage moved to Technical evaluation"),
      accepted("15 Oct 2026", "12 Jan 2027", FARHAN),
      { when: "14 Oct 2026", text: "Contact Priya Shetty added", by: ADITI, source: "Portal" },
      registered("14 Oct 2026", ADITI),
    ],
  },
  {
    id: "saffron-retail-group",
    customer: "Saffron Retail Group",
    website: "saffronretail.in",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "CleanStart Images",
    region: "India",
    manager: FARHAN,
    registeredBy: KARAN,
    registered: "2026-09-09",
    status: "Rejected",
    stage: "Not accepted",
    decidedOn: "2026-09-10",
    decidedBy: FARHAN,
    rejectionReason:
      "We could not confirm the opportunity. Add the person who owns the security budget at Saffron Retail Group, with their work email, and resubmit.",
    contacts: [],
    thread: [],
    history: [
      {
        when: "10 Sep 2026",
        text: "Not accepted: we could not confirm the opportunity",
        by: FARHAN,
        source: "Portal",
      },
      registered("9 Sep 2026", KARAN),
    ],
  },
  {
    id: "indus-paytech",
    customer: "Indus Paytech",
    website: "induspaytech.in",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "CleanStart Images",
    region: "India",
    manager: FARHAN,
    registeredBy: ADITI,
    registered: "2026-07-02",
    status: "Won",
    stage: "Closed won",
    closedOn: "2026-09-19",
    crmRef: "HS-47102",
    contacts: [],
    thread: [],
    history: [closed("19 Sep 2026", "Stage moved to Closed won"), registered("2 Jul 2026", ADITI)],
  },
  {
    id: "kaveri-biotech",
    customer: "Kaveri Biotech",
    website: "kaveribiotech.in",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "CleanStart Images",
    region: "India",
    manager: FARHAN,
    registeredBy: "Sneha Iyer",
    registered: "2026-05-28",
    status: "Won",
    stage: "Closed won",
    closedOn: "2026-08-11",
    crmRef: "HS-46540",
    contacts: [],
    thread: [],
    history: [closed("11 Aug 2026", "Stage moved to Closed won"), registered("28 May 2026", "Sneha Iyer")],
  },
  {
    id: "meridian-insurance",
    customer: "Meridian Insurance",
    website: "meridianinsure.in",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "Clean Libraries",
    region: "India",
    manager: FARHAN,
    registeredBy: KARAN,
    registered: "2026-06-12",
    status: "Lost",
    stage: "Closed lost",
    closedOn: "2026-10-02",
    contacts: [],
    thread: [],
    history: [closed("2 Oct 2026", "Stage moved to Closed lost"), registered("12 Jun 2026", KARAN)],
  },
  {
    id: "dunes-hospitality",
    customer: "Dunes Hospitality",
    website: "duneshospitality.ae",
    partner: KESTREL.org,
    partnerCategory: KESTREL_CATEGORY,
    product: "CleanSight",
    region: "Middle East",
    manager: OMAR,
    registeredBy: ADITI,
    registered: "2026-05-01",
    status: "Expired",
    stage: "No activity",
    closedOn: "2026-07-30",
    contacts: [],
    thread: [],
    history: [
      { when: "30 Jul 2026", text: "Protection ended, no activity", by: "CleanStart", source: "System" },
      registered("1 May 2026", ADITI),
    ],
  },
  {
    id: "gulfway-freight-arbor",
    customer: "Gulfway Freight",
    partner: "Arbor Cyber",
    partnerCategory: "System integrator",
    product: "CleanStart Images",
    region: "Middle East",
    manager: OMAR,
    registered: "2026-11-05",
    status: "Pending",
    stage: "Awaiting review",
    contacts: [{ name: "Layla Haddad" }],
    thread: [],
    history: [registered("5 Nov 2026", "Arbor Cyber")],
  },
  {
    id: "meridian-insurance-saffron",
    customer: "Meridian Insurance",
    partner: "Saffron Secure",
    partnerCategory: "Distributor",
    product: "CleanSight",
    region: "India",
    manager: FARHAN,
    registered: "2026-11-05",
    status: "Pending",
    stage: "Awaiting review",
    contacts: [{ name: "Ananya Kulkarni" }],
    thread: [],
    history: [registered("5 Nov 2026", "Saffron Secure")],
  },
  {
    id: "pearl-gulf-bank",
    customer: "Pearl Gulf Bank",
    partner: "Dunes Networks",
    partnerCategory: KESTREL_CATEGORY,
    product: "CleanSight",
    region: "Middle East",
    manager: OMAR,
    registered: "2026-11-03",
    status: "Accepted",
    stage: "Accepted",
    protectionEnd: "2027-02-02",
    decidedOn: "2026-11-05",
    decidedBy: OMAR,
    crmRef: "HS-48377",
    contacts: [],
    thread: [],
    history: [accepted("5 Nov 2026", "2 Feb 2027", OMAR), registered("3 Nov 2026", "Dunes Networks")],
  },
  {
    id: "tejas-labs",
    customer: "Tejas Labs",
    partner: "Saffron Secure",
    partnerCategory: "Distributor",
    product: "Clean Libraries",
    region: "India",
    manager: FARHAN,
    registered: "2026-11-02",
    status: "Accepted",
    stage: "Accepted",
    protectionEnd: "2027-02-01",
    decidedOn: "2026-11-04",
    decidedBy: FARHAN,
    crmRef: "HS-48352",
    contacts: [],
    thread: [],
    history: [accepted("4 Nov 2026", "1 Feb 2027", FARHAN), registered("2 Nov 2026", "Saffron Secure")],
  },
  {
    id: "coastline-telecom",
    customer: "Coastline Telecom",
    partner: "Arbor Cyber",
    partnerCategory: "System integrator",
    product: "CleanStart Images",
    region: "Middle East",
    manager: OMAR,
    registered: "2026-11-02",
    status: "Rejected",
    stage: "Not accepted",
    decidedOn: "2026-11-03",
    decidedBy: OMAR,
    rejectionReason: "This customer is already registered for this product.",
    contacts: [],
    thread: [],
    history: [
      { when: "3 Nov 2026", text: "Not accepted: this customer is already registered for this product", by: OMAR, source: "Portal" },
      registered("2 Nov 2026", "Arbor Cyber"),
    ],
  },
];

export const dealsSlice = createSlice<Deal[]>("deals", SEED);

export function useDeals(): Deal[] {
  return dealsSlice.use();
}

/** The admin nav badge: registrations waiting for a decision. */
export function useWaitingApprovals(): number {
  return dealsSlice.use().filter((d) => d.status === "Pending").length;
}

/** Tick state of the first-login checklist, keyed by step. */
export const welcomeSlice = createSlice<Record<string, boolean>>("welcome-setup", { agreement: true });

const kebab = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const PRODUCT_SLUG: Record<ProductName, string> = {
  "CleanStart Images": "images",
  "Clean Libraries": "libraries",
  CleanSight: "sight",
};

function uniqueId(deals: readonly Deal[], customer: string, product: ProductName): string {
  const taken = new Set(deals.map((d) => d.id));
  const base = kebab(customer);
  const withProduct = `${base}-${PRODUCT_SLUG[product]}`;
  if (!taken.has(base)) return base;
  if (!taken.has(withProduct)) return withProduct;
  let n = 2;
  while (taken.has(`${withProduct}-${n}`)) n += 1;
  return `${withProduct}-${n}`;
}

function nextCrmRef(deals: readonly Deal[]): string {
  const highest = deals.reduce((max, d) => {
    const n = Number(d.crmRef?.replace("HS-", ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `HS-${highest + 1}`;
}

const nowStamp = (): string => `${fmtShort(TODAY)}, ${NOW_TIME}`;

export interface RegistrationInput {
  customer: string;
  website: string;
  products: readonly ProductName[];
  region: Region;
  manager: ManagerName;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
}

/** Adds one Pending registration per picked product for Kestrel Systems. */
export function registerDeals(input: RegistrationInput): Deal[] {
  const customer = input.customer.trim();
  const created: Deal[] = [];
  const contactName = input.contactName.trim();
  const contacts: DealContact[] = contactName
    ? [
        {
          name: contactName,
          email: input.contactEmail.trim() || undefined,
          phone: input.contactPhone.trim() || undefined,
        },
      ]
    : [];
  dealsSlice.set((prev) => {
    let all = prev;
    for (const product of input.products) {
      const deal: Deal = {
        id: uniqueId(all, customer, product),
        customer,
        website: input.website.trim() || undefined,
        partner: KESTREL.org,
        partnerCategory: KESTREL_CATEGORY,
        product,
        region: input.region,
        manager: input.manager,
        registeredBy: KESTREL.user,
        registered: TODAY,
        registeredTime: NOW_TIME,
        status: "Pending",
        stage: "Awaiting review",
        notes: input.notes.trim() || undefined,
        contacts,
        thread: [],
        history: [registered(fmtLong(TODAY), KESTREL.user)],
      };
      created.push(deal);
      all = [...all, deal];
    }
    // newest first, as the Deals list reads in array order
    return [...created, ...prev];
  });
  for (const deal of created) {
    appendAudit({
      actor: KESTREL.user,
      action: "Registered a deal",
      target: `${deal.customer}, ${deal.product}, from ${deal.partner}`,
      detail: "Sent for approval. CleanStart reviews it within 2 business days.",
      source: "Portal",
    });
  }
  return created;
}

const update = (id: string, change: (deal: Deal) => Deal): void =>
  dealsSlice.set((prev) => prev.map((d) => (d.id === id ? change(d) : d)));

const targetOf = (deal: Deal): string => `${deal.customer}, ${deal.product}, from ${deal.partner}`;

/** Accepts a Pending registration: starts protection, creates the CRM reference and tells the partner. */
export function acceptDeal(id: string): void {
  const deal = dealsSlice.get().find((d) => d.id === id);
  if (!deal) return;
  const end = addDays(TODAY, PROTECTION_DAYS - 1);
  const ref = nextCrmRef(dealsSlice.get());
  const text = `Accepted, protected until ${fmtLong(end)}`;
  update(id, (d) => ({
    ...d,
    status: "Accepted",
    stage: "Accepted",
    protectionEnd: end,
    decidedOn: TODAY,
    decidedBy: STAFF.user,
    decidedLive: true,
    crmRef: ref,
    crmSynced: `Synced ${nowStamp()}`,
    history: [{ when: fmtLong(TODAY), text, by: STAFF.user, source: "Portal", auto: true }, ...d.history],
    thread: [
      ...d.thread,
      {
        id: `${d.id}-m${d.thread.length + 1}`,
        who: STAFF.user,
        org: "CleanStart",
        initials: STAFF.userInitials,
        self: false,
        when: nowStamp(),
        text: `Accepted. Protected until ${fmtLong(end)}.`,
        auto: true,
      },
    ],
  }));
  appendAudit({
    actor: STAFF.user,
    action: "Accepted a registration",
    target: targetOf(deal),
    detail: `HubSpot deal ${ref} created. Protected until ${fmtLong(end)}.`,
    source: "Portal",
  });
}

/** Rejects a Pending registration with the reason the partner will see. */
export function rejectDeal(id: string, reason: string): void {
  const deal = dealsSlice.get().find((d) => d.id === id);
  if (!deal) return;
  const why = reason.trim();
  update(id, (d) => ({
    ...d,
    status: "Rejected",
    stage: "Not accepted",
    decidedOn: TODAY,
    decidedBy: STAFF.user,
    decidedLive: true,
    rejectionReason: why,
    history: [
      { when: fmtLong(TODAY), text: `Not accepted: ${why}`, by: STAFF.user, source: "Portal", auto: true },
      ...d.history,
    ],
    thread: [
      ...d.thread,
      {
        id: `${d.id}-m${d.thread.length + 1}`,
        who: STAFF.user,
        org: "CleanStart",
        initials: STAFF.userInitials,
        self: false,
        when: nowStamp(),
        text: `Not accepted. ${why}`,
        auto: true,
      },
    ],
  }));
  appendAudit({
    actor: STAFF.user,
    action: "Rejected a registration",
    target: targetOf(deal),
    detail: `Reason sent to the partner: ${why}`,
    source: "Portal",
  });
}

/** Puts a decision taken in this session back in the queue. */
export function undoDecision(id: string): void {
  const deal = dealsSlice.get().find((d) => d.id === id);
  if (!deal) return;
  update(id, (d) => ({
    ...d,
    status: "Pending",
    stage: "Awaiting review",
    protectionEnd: undefined,
    decidedOn: undefined,
    decidedBy: undefined,
    decidedLive: undefined,
    rejectionReason: undefined,
    crmRef: undefined,
    crmSynced: undefined,
    history: d.history.filter((e) => !e.auto),
    thread: d.thread.filter((m) => !m.auto),
  }));
  appendAudit({
    actor: STAFF.user,
    action: "Undid a decision",
    target: targetOf(deal),
    detail: "The registration is back in the approvals queue.",
    source: "Portal",
  });
}

export interface ResubmitInput {
  name: string;
  title: string;
  email: string;
  note: string;
}

/** The partner fixes a rejected registration and sends it for review again. */
export function resubmitDeal(id: string, input: ResubmitInput): void {
  const deal = dealsSlice.get().find((d) => d.id === id);
  if (!deal) return;
  const note = input.note.trim();
  update(id, (d) => ({
    ...d,
    status: "Pending",
    stage: "Awaiting review",
    resubmittedOn: TODAY,
    decidedOn: undefined,
    decidedBy: undefined,
    decidedLive: undefined,
    rejectionReason: undefined,
    contacts: [
      { name: input.name.trim(), role: input.title.trim() || undefined, email: input.email.trim() },
      ...d.contacts,
    ],
    history: [
      {
        when: fmtLong(TODAY),
        text: note ? `Resubmitted: ${note}` : "Resubmitted with a new contact",
        by: KESTREL.user,
        source: "Portal",
      },
      ...d.history,
    ],
  }));
  appendAudit({
    actor: KESTREL.user,
    action: "Resubmitted a registration",
    target: targetOf(deal),
    detail: `New contact ${input.name.trim()} added.`,
    source: "Portal",
  });
}

/** The partner writes in the deal conversation. */
export function postDealMessage(id: string, text: string): void {
  update(id, (d) => ({
    ...d,
    thread: [
      ...d.thread,
      {
        id: `${d.id}-m${d.thread.length + 1}`,
        who: KESTREL.user,
        org: KESTREL.org,
        initials: KESTREL.userInitials,
        self: true,
        when: "Just now",
        text: text.trim(),
      },
    ],
  }));
}

/** The partner asks the partner manager for more protection time. */
export function requestExtension(id: string, why: string): void {
  const deal = dealsSlice.get().find((d) => d.id === id);
  if (!deal) return;
  update(id, (d) => ({
    ...d,
    extensionRequested: true,
    history: [
      {
        when: fmtLong(TODAY),
        text: `Extension requested: ${why.trim()}`,
        by: KESTREL.user,
        source: "Portal",
      },
      ...d.history,
    ],
  }));
  appendAudit({
    actor: KESTREL.user,
    action: "Requested a protection extension",
    target: targetOf(deal),
    detail: why.trim(),
    source: "Portal",
  });
}
