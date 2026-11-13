import { describe, expect, it } from 'vitest';
import { dealProperties } from './mappers';
import {
  COMPANY_PROPERTIES, DEAL_PROPERTIES, EXTERNAL_DEAL_PROPERTIES, PIPELINE_SPEC, withoutUniqueValues,
} from './schema-spec';
import { STAGE_LABELS, type StageIds } from './types';

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

  it('withoutUniqueValues keeps every property and drops only the unique flag', () => {
    const plain = withoutUniqueValues(DEAL_PROPERTIES);
    expect(plain.map((p) => p.name)).toEqual(DEAL_PROPERTIES.map((p) => p.name));
    expect(plain.some((p) => p.hasUniqueValue)).toBe(false);
    expect(plain.find((p) => p.name === 'portal_registration_id')).toMatchObject({ type: 'string', fieldType: 'text' });
    expect(DEAL_PROPERTIES.find((p) => p.name === 'portal_registration_id')?.hasUniqueValue).toBe(true);
  });

  it('names every deal property the mapper writes that this spec does not create', () => {
    const stageIds = Object.fromEntries(STAGE_LABELS.map((l) => [l, l])) as StageIds;
    const written = Object.keys(dealProperties(
      { id: 'r', customerName: 'c', product: 'p', region: 'r', protectionEnd: '2027-01-01' },
      { name: 'n', hubspotCompanyId: '1' }, stageIds, 'pipe',
    ));
    const created = new Set(DEAL_PROPERTIES.map((p) => p.name));
    const standard = new Set(['dealname', 'pipeline', 'dealstage']);
    const missing = written.filter((n) => !created.has(n) && !standard.has(n));
    expect(missing.sort()).toEqual([...EXTERNAL_DEAL_PROPERTIES].sort());
  });
});
