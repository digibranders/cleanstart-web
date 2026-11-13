import type { ManagerOptionDto } from "@/lib/dto";

/** One choice per manager. The label is the name; two managers with the same name get their team added so labels stay unique. */
export function managerChoices(managers: readonly ManagerOptionDto[]): { id: string; label: string }[] {
  const counts = new Map<string, number>();
  for (const m of managers) counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
  return managers.map((m) => ({ id: m.id, label: (counts.get(m.name) ?? 0) > 1 ? `${m.name}, ${m.team}` : m.name }));
}
