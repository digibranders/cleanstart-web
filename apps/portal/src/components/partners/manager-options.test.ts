import { describe, expect, it } from 'vitest';
import { managerChoices } from './manager-options';

const manager = (id: string, name: string, team: string) => ({ id, name, region: 'india' as const, team });

describe('managerChoices', () => {
  it('uses the name as the label and keeps the id for each choice', () => {
    expect(managerChoices([manager('a', 'Gaurav Jadhav', 'CleanStart India'), manager('b', 'Omar Nasser', 'CleanStart Middle East')])).toEqual([
      { id: 'a', label: 'Gaurav Jadhav' },
      { id: 'b', label: 'Omar Nasser' },
    ]);
  });

  it('tells two managers with the same name apart by their team', () => {
    const choices = managerChoices([manager('a', 'Sam Lee', 'CleanStart India'), manager('b', 'Sam Lee', 'CleanStart Middle East')]);
    expect(choices.map((c) => c.label)).toEqual(['Sam Lee, CleanStart India', 'Sam Lee, CleanStart Middle East']);
    expect(new Set(choices.map((c) => c.label)).size).toBe(2);
  });
});
