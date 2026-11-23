import type { PartnerRole } from '@/lib/domain';
import type { TeamMemberDto } from '@/lib/dto';

export type TeamSort = 'default' | 'name' | 'last_active';
export interface TeamFilter {
  q: string;
  role: PartnerRole | 'all';
  status: TeamMemberDto['status'] | 'all';
  sort: TeamSort;
}

/** Name or email contains the search text; then role and status filters; then the sort. "last_active" puts the most recent first and people who never signed in last. */
export function filterTeam(members: readonly TeamMemberDto[], filter: TeamFilter): TeamMemberDto[] {
  const q = filter.q.trim().toLowerCase();
  const kept = members.filter(
    (m) =>
      (q === '' || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) &&
      (filter.role === 'all' || m.role === filter.role) &&
      (filter.status === 'all' || m.status === filter.status),
  );
  if (filter.sort === 'name') return [...kept].sort((a, b) => a.name.localeCompare(b.name));
  if (filter.sort === 'last_active') {
    return [...kept].sort((a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? '') || a.name.localeCompare(b.name));
  }
  return [...kept];
}
