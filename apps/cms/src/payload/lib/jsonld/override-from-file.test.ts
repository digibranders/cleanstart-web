import { describe, expect, it } from 'vitest';

import { parseUploadedSchema } from './override-from-file';

describe('parseUploadedSchema', () => {
  it('parses a single JSON object', () => {
    const r = parseUploadedSchema('{"@context":"https://schema.org","@type":"WebPage","name":"X"}');
    expect(r.error).toBeNull();
    expect((r.value as { '@type': string })['@type']).toBe('WebPage');
  });

  it('parses multiple <script> blocks into an array', () => {
    const text = `
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>
      <!-- comment -->
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage"}</script>
    `;
    const r = parseUploadedSchema(text);
    expect(r.error).toBeNull();
    expect(Array.isArray(r.value)).toBe(true);
    expect((r.value as Array<{ '@type': string }>).map((b) => b['@type'])).toEqual([
      'WebPage',
      'FAQPage',
    ]);
  });

  it('tolerates trailing commas (warns)', () => {
    const r = parseUploadedSchema('{"@context":"https://schema.org","@type":"WebPage",}');
    expect(r.error).toBeNull();
    expect(r.warnings.join(' ')).toMatch(/trailing comma/i);
  });

  it('reports a parse error for malformed JSON', () => {
    const r = parseUploadedSchema('{ not json');
    expect(r.value).toBeNull();
    expect(r.error).toBeTruthy();
  });

  it('errors on empty input', () => {
    expect(parseUploadedSchema('   ').value).toBeNull();
    expect(parseUploadedSchema('   ').error).toBeTruthy();
  });
});
