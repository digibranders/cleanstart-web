import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';

import { collectFieldLabels, exportHeaderLabel, humanizeFieldName } from './field-labels';

describe('humanizeFieldName', () => {
  it('splits camelCase into title-cased words', () => {
    expect(humanizeFieldName('partnerName')).toBe('Partner Name');
    expect(humanizeFieldName('partnerRepFirstName')).toBe('Partner Rep First Name');
    expect(humanizeFieldName('consentGivenAt')).toBe('Consent Given At');
  });

  it('handles kebab/snake and the synthetic prefix', () => {
    expect(humanizeFieldName('deal-details')).toBe('Deal Details');
    expect(humanizeFieldName('some_field')).toBe('Some Field');
    expect(humanizeFieldName('__schemaTypes')).toBe('Schema Types');
  });
});

describe('collectFieldLabels', () => {
  it('indexes explicit string labels and recurses into groups/tabs', () => {
    const fields = [
      { name: 'partnerName', type: 'text', label: 'Partner Name' },
      { name: 'prospectEmail', type: 'email' },
      {
        name: 'meta',
        type: 'group',
        fields: [{ name: 'source', type: 'text', label: 'Lead Source' }],
      },
      {
        type: 'tabs',
        tabs: [{ fields: [{ name: 'notes', type: 'textarea', label: { en: 'Notes' } }] }],
      },
    ] as unknown as Field[];

    const map = collectFieldLabels(fields);
    expect(map.get('partnerName')).toBe('Partner Name');
    expect(map.get('prospectEmail')).toBeUndefined();
    expect(map.get('source')).toBe('Lead Source');
    expect(map.get('notes')).toBe('Notes');
  });

  it('is safe on undefined field lists', () => {
    expect(collectFieldLabels(undefined).size).toBe(0);
  });
});

describe('exportHeaderLabel', () => {
  const map = new Map<string, string>([['reviewedBy', 'Reviewed By']]);

  it('prefers an explicit label, then synthetic, then humanised name', () => {
    expect(exportHeaderLabel('reviewedBy', map)).toBe('Reviewed By');
    expect(exportHeaderLabel('__schemaTypes', map)).toBe('Schema Types');
    expect(exportHeaderLabel('prospectEmail', map)).toBe('Prospect Email');
  });
});
