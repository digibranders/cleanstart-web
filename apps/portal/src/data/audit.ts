import { DEMO_NOW_LABEL, DEMO_TODAY } from "@/lib/demo-date";
import { createSlice } from "@/lib/slice";

export interface AuditInput {
  actor: string;
  /** Short past-tense action, e.g. "Accepted registration". */
  action: string;
  target: string;
  detail?: string;
  source: "Portal" | "CRM" | "System";
}

export type AuditKind = "Deal decisions" | "Partners" | "Documents" | "People and access";
export type AuditWho = "staff" | "partner" | "sync";

export interface AuditEntry {
  id: string;
  /** Days before the demo "today", used by the period filter. */
  ageDays: number;
  when: string;
  full: string;
  who: string;
  whoRole: string;
  whoKind: AuditWho;
  kind: AuditKind;
  action: string;
  target: string;
  source: string;
  before: string;
  after: string;
  note: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayLabel(ageDays: number): string {
  const d = new Date(Date.UTC(2026, 10, 6 - ageDays));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()] ?? ""}`;
}

function seedEntry(
  id: string,
  ageDays: number,
  time: string,
  who: string,
  role: string,
  kind: AuditKind,
  action: string,
  target: string,
  source: string,
  before: string,
  after: string,
  note: string,
): AuditEntry {
  const sync = role === "Sync";
  const lead = ageDays === 0 ? "Today" : ageDays === 1 ? "Yesterday" : dayLabel(ageDays);
  return {
    id,
    ageDays,
    when: `${lead}, ${time}`,
    full: `${dayLabel(ageDays)} 2026, ${time}`,
    who,
    whoRole: sync ? "Automatic sync" : role,
    whoKind: sync ? "sync" : role.includes(",") ? "partner" : "staff",
    kind,
    action,
    target,
    source,
    before,
    after,
    note,
  };
}

const SEED: AuditEntry[] = [
  seedEntry("e1", 0, "14:02", "HubSpot", "Sync", "Deal decisions", "Stage changed", "Vardhan Capital, CleanSight", "HubSpot", "Technical evaluation", "Proposal sent", "Stage changes in HubSpot show on the partner's deal page."),
  seedEntry("e2", 1, "16:40", "Omar Nasser", "Partner manager", "Deal decisions", "Accepted a registration", "Pearl Gulf Bank, CleanSight, from Dunes Networks", "Portal", "", "", "HubSpot deal HS-48377 created. Protected until 3 Feb 2027."),
  seedEntry("e3", 1, "11:12", "Aditi Rao", "Kestrel Systems, partner admin", "People and access", "Invited a user", "Vikram Sethi, sales, at Kestrel Systems", "Portal", "", "", ""),
  seedEntry("e4", 2, "17:05", "Farhan Qureshi", "Partner manager", "Deal decisions", "Accepted a registration", "Tejas Labs, Clean Libraries, from Saffron Secure", "Portal", "", "", "HubSpot deal HS-48352 created."),
  seedEntry("e5", 2, "10:30", "Ishita Bose", "Marketing", "Documents", "Uploaded a document", "CleanSight product walkthrough", "Portal", "", "", "Video, MP4, 14 min. Open to all partners."),
  seedEntry("e6", 3, "15:22", "Omar Nasser", "Partner manager", "Deal decisions", "Rejected a registration", "Coastline Telecom, CleanStart Images, from Arbor Cyber", "Portal", "", "", "Reason sent to the partner: this customer is already registered for this product."),
  seedEntry("e7", 6, "12:48", "Omar Nasser", "Partner manager", "Deal decisions", "Accepted a registration", "Al Noor Logistics, Clean Libraries, from Kestrel Systems", "Portal", "", "", "HubSpot deal HS-48201 created."),
  seedEntry("e8", 7, "09:15", "Arjun Pillai", "Meghdoot Systems, partner admin", "Partners", "Accepted the partner agreement", "Meghdoot Systems", "Portal", "Not accepted", "Version 1.2", ""),
  seedEntry("e9", 9, "18:02", "Farhan Qureshi", "Partner manager", "Partners", "Approved an application", "Meghdoot Systems", "Portal", "", "", "Invite sent to Arjun Pillai, who becomes the partner admin."),
  seedEntry("e10", 10, "14:30", "Omar Nasser", "Partner manager", "Partners", "Approved an application", "Qamar Solutions", "Portal", "", "", "Invite sent to Yasmin Haddad, who becomes the partner admin."),
  seedEntry("e11", 17, "11:00", "Ishita Bose", "Marketing", "Documents", "Changed who can open it", "Competitive battlecard", "Portal", "All partners", "Distributors, channel partners", ""),
  seedEntry("e12", 22, "14:06", "Farhan Qureshi", "Partner manager", "Deal decisions", "Accepted a registration", "Vardhan Capital, CleanSight, from Kestrel Systems", "Portal", "", "", "HubSpot deal HS-48213 created. Protected until 12 Jan 2027."),
  seedEntry("e13", 36, "10:05", "Ishita Bose", "Marketing", "Documents", "Uploaded a document", "Gulf region price list", "Portal", "", "", "PDF, 310 KB. Open to 2 named partners."),
];

const auditSlice = createSlice<AuditEntry[]>("audit", SEED);

/** Roles the log shows under a known actor; an unknown actor is treated as CleanStart staff. */
const ACTOR_ROLES: Record<string, string> = {
  "Farhan Qureshi": "Partner manager",
  "Omar Nasser": "Partner manager",
  "Ishita Bose": "Marketing",
  "Aditi Rao": "Kestrel Systems, partner admin",
  "Yasmin Haddad": "Qamar Solutions, partner admin",
  "Arjun Pillai": "Meghdoot Systems, partner admin",
};

function kindOf(action: string): AuditKind {
  const a = action.toLowerCase();
  if (/document|upload/.test(a)) return "Documents";
  if (/registration|deal|stage/.test(a)) return "Deal decisions";
  if (/application|agreement/.test(a)) return "Partners";
  return "People and access";
}

/** A plain function on a slice: callable from any screen, no React context needed. */
export function appendAudit(entry: AuditInput): void {
  const sync = entry.source === "CRM";
  const role = sync ? "Automatic sync" : (ACTOR_ROLES[entry.actor] ?? "");
  const time = DEMO_NOW_LABEL.split(", ")[1] ?? "";
  auditSlice.set((prev) => [
    {
      id: `a${prev.length + 1}`,
      ageDays: 0,
      when: DEMO_NOW_LABEL,
      full: `${DEMO_TODAY}, ${time}`,
      who: entry.actor,
      whoRole: role,
      whoKind: sync ? "sync" : role.includes(",") ? "partner" : "staff",
      kind: kindOf(entry.action),
      action: entry.action,
      target: entry.target,
      source: sync ? "HubSpot" : entry.source,
      before: "",
      after: "",
      note: entry.detail ?? "",
    },
    ...prev,
  ]);
}

/** Entries newest first. */
export function useAudit(): AuditEntry[] {
  return auditSlice.use();
}
