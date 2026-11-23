import type { PartnerPersonDto } from "@/lib/dto";

/** A row that only has an invite: its id is the invite id and there is no login to remove. */
export const inviteOnly = (person: PartnerPersonDto): boolean => person.inviteId !== null && person.inviteId === person.id;

/** True when somebody with a login can act as the company's partner admin. A pending admin invite does not count. */
export const hasActiveAdmin = (people: readonly PartnerPersonDto[]): boolean =>
  people.some((p) => p.role === "partner_admin" && p.status === "active");

/** Who can take over a leaving person's deals: someone who stays, has a login and registers deals (not technical). */
export const moveTargets = (people: readonly PartnerPersonDto[], leaving: PartnerPersonDto): PartnerPersonDto[] =>
  people.filter((p) => p.id !== leaving.id && p.status === "active" && p.role !== "technical" && !inviteOnly(p));
