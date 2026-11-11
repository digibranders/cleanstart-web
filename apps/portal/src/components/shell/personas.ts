export interface Persona {
  org: string;
  orgSub: string;
  orgInitials: string;
  user: string;
  userInitials: string;
  role: string;
  /** Partner manager the "Message" drawer writes to (partner personas only). */
  manager?: { name: string; initials: string; team: string };
}

export const KESTREL: Persona = {
  org: "Kestrel Systems",
  orgSub: "Channel partner, India",
  orgInitials: "KS",
  user: "Aditi Rao",
  userInitials: "AR",
  role: "Partner admin",
  manager: { name: "Farhan Qureshi", initials: "FQ", team: "CleanStart India" },
};

export const QAMAR: Persona = {
  org: "Qamar Solutions",
  orgSub: "Channel partner, Middle East",
  orgInitials: "QS",
  user: "Yasmin Haddad",
  userInitials: "YH",
  role: "Partner admin",
  manager: { name: "Omar Nasser", initials: "ON", team: "CleanStart Middle East" },
};

export const STAFF: Persona = {
  org: "CleanStart",
  orgSub: "Partnerships",
  orgInitials: "CS",
  user: "Farhan Qureshi",
  userInitials: "FQ",
  role: "Partner manager, India",
};
