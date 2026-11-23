import { describe, expect, it } from 'vitest';
import type { TeamMemberDto } from '@/lib/dto';
import { filterTeam } from './team-list';

const member = (over: Partial<TeamMemberDto>): TeamMemberDto => ({
  id: over.name ?? 'x',
  name: 'Person',
  email: 'person@kestrelsystems.in',
  role: 'sales',
  status: 'active',
  lastActiveAt: null,
  invitedAt: null,
  deals: 0,
  isYou: false,
  title: null,
  phone: null,
  inviteId: null,
  ...over,
});

const team = [
  member({ name: 'Zoya Khan', email: 'zoya@kestrelsystems.in', lastActiveAt: '2026-11-20T10:00:00.000Z' }),
  member({ name: 'Aditi Rao', email: 'aditi.rao@kestrelsystems.in', role: 'partner_admin', lastActiveAt: '2026-11-22T10:00:00.000Z' }),
  member({ name: 'Karan Malhotra', email: 'karan@kestrelsystems.in', role: 'technical', status: 'invited' }),
];
const base = { q: '', role: 'all', status: 'all', sort: 'default' } as const;

describe('filterTeam', () => {
  it('keeps the given order by default', () => {
    expect(filterTeam(team, base).map((m) => m.name)).toEqual(['Zoya Khan', 'Aditi Rao', 'Karan Malhotra']);
  });

  it('searches name and email, ignoring case', () => {
    expect(filterTeam(team, { ...base, q: 'RAO' }).map((m) => m.name)).toEqual(['Aditi Rao']);
    expect(filterTeam(team, { ...base, q: 'karan@' }).map((m) => m.name)).toEqual(['Karan Malhotra']);
  });

  it('filters by role and status', () => {
    expect(filterTeam(team, { ...base, role: 'technical' }).map((m) => m.name)).toEqual(['Karan Malhotra']);
    expect(filterTeam(team, { ...base, status: 'invited' }).map((m) => m.name)).toEqual(['Karan Malhotra']);
    expect(filterTeam(team, { ...base, role: 'sales', status: 'invited' })).toEqual([]);
  });

  it('sorts by name, and by last active with never-signed-in last', () => {
    expect(filterTeam(team, { ...base, sort: 'name' }).map((m) => m.name)).toEqual(['Aditi Rao', 'Karan Malhotra', 'Zoya Khan']);
    expect(filterTeam(team, { ...base, sort: 'last_active' }).map((m) => m.name)).toEqual(['Aditi Rao', 'Zoya Khan', 'Karan Malhotra']);
  });
});
