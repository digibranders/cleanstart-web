import { describe, expect, it } from 'vitest';

import { LegalDocuments, LEGAL_ICON_OPTIONS } from './Legal';

const fieldNames = (LegalDocuments.fields ?? [])
  .map((f) => ('name' in f ? f.name : undefined))
  .filter((n): n is string => Boolean(n));

describe('LegalDocuments collection', () => {
  it('uses the namespaced slug (not the GDPR `legal` global)', () => {
    expect(LegalDocuments.slug).toBe('legalDocuments');
  });

  it('exposes the public + compliance fields', () => {
    for (const required of [
      'title',
      'slug',
      'order',
      'icon',
      'effectiveDate',
      'body',
      'lastReviewedAt',
      'changeSummary',
    ]) {
      expect(fieldNames).toContain(required);
    }
  });

  it('requires an effective date for legal correctness', () => {
    const effectiveDate = (LegalDocuments.fields ?? []).find(
      (f) => 'name' in f && f.name === 'effectiveDate',
    );
    expect(effectiveDate && 'required' in effectiveDate && effectiveDate.required).toBe(true);
  });

  it('retains full version history (no maxPerDoc cap) for audit', () => {
    expect(LegalDocuments.versions).toMatchObject({ drafts: { schedulePublish: true } });
    expect((LegalDocuments.versions as { maxPerDoc?: number }).maxPerDoc).toBeUndefined();
  });

  it('constrains the icon field to the shared allow-list', () => {
    const icon = (LegalDocuments.fields ?? []).find(
      (f) => 'name' in f && f.name === 'icon',
    ) as { options?: Array<{ value: string }> } | undefined;
    const optionValues = (icon?.options ?? []).map((o) => o.value);
    expect(optionValues).toEqual([...LEGAL_ICON_OPTIONS]);
  });
});
