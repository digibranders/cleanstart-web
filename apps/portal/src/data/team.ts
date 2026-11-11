import { createSlice } from "@/lib/slice";

export type PartnerRole = "Partner admin" | "Sales" | "Technical";
export type MemberStatus = "Active" | "Invited";

export interface TeamMember {
  name: string;
  email: string;
  role: PartnerRole;
  status: MemberStatus;
  last: string;
  deals: number;
  you?: boolean;
}

export interface AccessRequest {
  name: string;
  email: string;
  when: string;
  note: string;
  role: Exclude<PartnerRole, "Partner admin">;
}

export interface KestrelTeam {
  members: TeamMember[];
  requests: AccessRequest[];
}

export const teamSlice = createSlice<KestrelTeam>("kestrel-team", {
  members: [
    { name: "Aditi Rao", email: "aditi.rao@kestrelsystems.in", role: "Partner admin", status: "Active", last: "Now", deals: 5, you: true },
    { name: "Karan Malhotra", email: "karan.malhotra@kestrelsystems.in", role: "Sales", status: "Active", last: "Yesterday", deals: 4 },
    { name: "Sneha Iyer", email: "sneha.iyer@kestrelsystems.in", role: "Technical", status: "Active", last: "2 Nov 2026", deals: 1 },
    { name: "Vikram Sethi", email: "vikram.sethi@kestrelsystems.in", role: "Sales", status: "Invited", last: "Invited 5 Nov", deals: 0 },
  ],
  requests: [
    { name: "Rohit Desai", email: "rohit.desai@kestrelsystems.in", when: "Asked today", note: "I lead the Mumbai sales team.", role: "Sales" },
  ],
});

export type StaffRole = "Partner manager" | "Sales" | "Marketing";
export type StaffRegion = "India" | "Middle East" | "All regions";

export interface StaffMember {
  name: string;
  email: string;
  role: StaffRole;
  region: StaffRegion;
  partners: string[];
  last: string;
  status: MemberStatus;
  you?: boolean;
}

export const staffSlice = createSlice<StaffMember[]>("cleanstart-staff", [
  { name: "Farhan Qureshi", email: "farhan.qureshi@cleanstart.com", role: "Partner manager", region: "India", partners: ["Kestrel Systems", "Saffron Secure", "Vyom Digital", "Meghdoot Systems", "Ironleaf Consulting"], last: "Now", status: "Active", you: true },
  { name: "Omar Nasser", email: "omar.nasser@cleanstart.com", role: "Partner manager", region: "Middle East", partners: ["Arbor Cyber", "Dunes Networks", "Harbourline IT", "Coralbay Technologies", "Qamar Solutions"], last: "Today", status: "Active" },
  { name: "Rahul Menon", email: "rahul.menon@cleanstart.com", role: "Sales", region: "India", partners: [], last: "Yesterday", status: "Active" },
  { name: "Sara Al Mansoori", email: "sara.almansoori@cleanstart.com", role: "Sales", region: "Middle East", partners: [], last: "4 Nov", status: "Active" },
  { name: "Ishita Bose", email: "ishita.bose@cleanstart.com", role: "Marketing", region: "All regions", partners: [], last: "4 Nov", status: "Active" },
  { name: "Kunal Shah", email: "kunal.shah@cleanstart.com", role: "Sales", region: "India", partners: [], last: "Invited 5 Nov", status: "Invited" },
]);

export interface NotificationPrefs {
  decision: boolean;
  stage: boolean;
  expiry: boolean;
  docs: boolean;
  team: boolean;
}

export interface AccountState {
  name: string;
  title: string;
  phone: string;
  notify: NotificationPrefs;
  twoStepOn: boolean;
}

export const accountSlice = createSlice<AccountState>("kestrel-account", {
  name: "Aditi Rao",
  title: "Head of Alliances",
  phone: "+91 98450 22617",
  notify: { decision: true, stage: true, expiry: true, docs: false, team: true },
  twoStepOn: false,
});

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** "meera.pillai@x.in" becomes "Meera Pillai". */
export function nameFromEmail(email: string): string {
  return (email.split("@")[0] ?? "")
    .split(".")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function rowKey(email: string): string {
  return (email.split("@")[0] ?? "").replace(/[^a-z0-9]/gi, "");
}
