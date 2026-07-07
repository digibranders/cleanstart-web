import type { CollectionConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import { EXPORTABLE_COLLECTION_SLUGS, wireExportButton } from './wire-export-button';

const baseCollection = (slug: string, fields: CollectionConfig['fields'] = []): CollectionConfig => ({
  slug,
  fields,
});

describe('wireExportButton', () => {
  it('leaves a non-exportable collection untouched', () => {
    const input = baseCollection('media');
    const output = wireExportButton(input);
    expect(output).toBe(input);
  });

  it('marks an exportable collection as export-enabled with a /export endpoint', () => {
    const input = baseCollection('blogs', [{ name: 'publishedAt', type: 'date' }]);
    const output = wireExportButton(input);
    expect(output.custom?.export).toEqual({ enabled: true, dateField: 'publishedAt' });
    const endpoints = output.endpoints === false ? [] : (output.endpoints ?? []);
    expect(endpoints.some((e) => 'path' in e && e.path === '/export')).toBe(true);
  });

  it('falls back to createdAt when a collection has no publishedAt field', () => {
    const input = baseCollection('forms', [{ name: 'title', type: 'text' }]);
    const output = wireExportButton(input);
    expect(output.custom?.export?.dateField).toBe('createdAt');
  });

  it('excludes leads and partner-applications (own bespoke export)', () => {
    expect(EXPORTABLE_COLLECTION_SLUGS).not.toContain('leads');
    expect(EXPORTABLE_COLLECTION_SLUGS).not.toContain('partner-applications');
  });
});
