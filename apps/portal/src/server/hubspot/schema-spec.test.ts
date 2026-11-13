import { describe, expect, it } from 'vitest';
import { COMPANY_PROPERTIES, DEAL_PROPERTIES, PIPELINE_SPEC } from './schema-spec';

describe('schema spec', () => {
  it('has the seven stages in order with closed won at probability 1 and lost types at 0', () => {
    expect(PIPELINE_SPEC.stages.map((s) => s.label)).toEqual([
      'Accepted',
      'Discovery',
      'Technical evaluation',
      'Proposal sent',
      'Closed won',
      'Closed lost',
      'Registration expired',
    ]);
    const byLabel = Object.fromEntries(PIPELINE_SPEC.stages.map((s) => [s.label, s.metadata.probability]));
    expect(byLabel['Closed won']).toBe('1.0');
    expect(byLabel['Closed lost']).toBe('0.0');
    expect(byLabel['Registration expired']).toBe('0.0');
  });

  it('makes portal_registration_id unique so a retried create cannot duplicate a deal', () => {
    const prop = DEAL_PROPERTIES.find((p) => p.name === 'portal_registration_id');
    expect(prop?.hasUniqueValue).toBe(true);
  });

  it('defines the partner flag on companies', () => {
    expect(COMPANY_PROPERTIES.map((p) => p.name)).toEqual(
      expect.arrayContaining(['cleanstart_partner', 'partner_category', 'partner_portal_id', 'partner_manager']),
    );
  });
});
