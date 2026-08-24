import { describe, expect, it } from 'vitest';

import { EXPORT_FIELD_DENYLIST, isExportableFieldName, serializeFieldValue } from './serialize-field';

describe('serializeFieldValue', () => {
  it('passes through primitives as strings', () => {
    expect(serializeFieldValue('text', 'hello')).toBe('hello');
    expect(serializeFieldValue('number', 42)).toBe('42');
    expect(serializeFieldValue('checkbox', true)).toBe('true');
  });

  it('renders null/undefined as an empty string', () => {
    expect(serializeFieldValue('text', null)).toBe('');
    expect(serializeFieldValue('text', undefined)).toBe('');
  });

  it('renders date fields as the raw ISO string', () => {
    expect(serializeFieldValue('date', '2026-07-01T00:00:00.000Z')).toBe(
      '2026-07-01T00:00:00.000Z',
    );
  });

  it('renders a populated relationship as its title/name/slug', () => {
    expect(
      serializeFieldValue('relationship', { id: 5, title: 'Container Security 101' }),
    ).toBe('Container Security 101');
    expect(serializeFieldValue('relationship', { id: 5, name: 'Dhanush VM' })).toBe(
      'Dhanush VM',
    );
    expect(serializeFieldValue('relationship', { id: 5, slug: 'cyber-security' })).toBe(
      'cyber-security',
    );
  });

  it('renders an unpopulated relationship (a bare id) as the id', () => {
    expect(serializeFieldValue('relationship', 5)).toBe('5');
  });

  it('renders a populated upload (media) doc as its absolute url, not the id', () => {
    expect(
      serializeFieldValue('upload', {
        id: 367,
        filename: 'sbom-101-hero-abc123.webp',
        url: 'https://cdn.cleanstart.com/web/general/sbom-101-hero-abc123.webp',
      }),
    ).toBe('https://cdn.cleanstart.com/web/general/sbom-101-hero-abc123.webp');
  });

  it('falls back to filename when an upload doc has no url', () => {
    expect(serializeFieldValue('upload', { id: 367, filename: 'sbom-101-hero.webp' })).toBe(
      'sbom-101-hero.webp',
    );
  });

  it('falls back to the id for an upload doc with neither url nor filename', () => {
    expect(serializeFieldValue('upload', { id: 367 })).toBe('367');
  });

  it('renders an array of populated uploads (hasMany) as urls joined by "; "', () => {
    expect(
      serializeFieldValue('relationship', [
        { id: 1, url: 'https://cdn.cleanstart.com/g/a.webp' },
        { id: 2, url: 'https://cdn.cleanstart.com/g/b.webp' },
      ]),
    ).toBe('https://cdn.cleanstart.com/g/a.webp; https://cdn.cleanstart.com/g/b.webp');
  });

  it('renders an array of populated relationships joined by "; "', () => {
    expect(
      serializeFieldValue('relationship', [
        { id: 1, title: 'Cyber Security' },
        { id: 2, title: 'Data Protection' },
      ]),
    ).toBe('Cyber Security; Data Protection');
  });

  it('summarizes a faqs-shaped array of plain sub-object rows instead of emitting raw row ids', () => {
    // `faqs` is a Payload `type: 'array'` field, not a relationship — each
    // row is `{ id, question, answer }` with no title/name/slug/url/
    // filename, so `inferFieldType` (which only sees the runtime shape)
    // misclassifies it as 'relationship'. Regression test for the bug
    // where this fell through to the bare row id instead of the content.
    const answer = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Yes, CleanStart images are minimal' }],
          },
        ],
      },
    };
    const result = serializeFieldValue('relationship', [
      { id: 'a1b2c3', question: 'Are the images minimal?', answer },
    ]);
    expect(result).toBe('Question: Are the images minimal? Answer: Yes, CleanStart images are minimal.');
    expect(result).not.toContain('a1b2c3');
  });

  it('joins multiple faqs-shaped rows with "; ", each summarized rather than reduced to its id', () => {
    const makeAnswer = (text: string) => ({
      root: { children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] },
    });
    const result = serializeFieldValue('relationship', [
      { id: 'row-1', question: 'What is CleanStart?', answer: makeAnswer('A hardened base image provider') },
      { id: 'row-2', question: 'Is it free?', answer: makeAnswer('Some tiers are free') },
    ]);
    expect(result).toBe(
      'Question: What is CleanStart? Answer: A hardened base image provider.; Question: Is it free? Answer: Some tiers are free.',
    );
  });

  it('extracts plain text from a Lexical richText value', () => {
    const lexical = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'world' }],
          },
        ],
      },
    };
    expect(serializeFieldValue('richText', lexical)).toBe('Hello world.');
  });


  it('JSON-stringifies plain arrays, groups, and blocks', () => {
    expect(serializeFieldValue('array', [{ a: 1 }])).toBe('[{"a":1}]');
    expect(serializeFieldValue('group', { a: 1 })).toBe('{"a":1}');
  });

  it('neutralises a leading-= formula-injection payload', () => {
    expect(serializeFieldValue('text', '=cmd|"/c calc"!A1')).toBe(
      '\'=cmd|"/c calc"!A1',
    );
  });
});

describe('isExportableFieldName', () => {
  it('rejects the denylisted field names', () => {
    for (const name of EXPORT_FIELD_DENYLIST) {
      expect(isExportableFieldName(name)).toBe(false);
    }
  });

  it('accepts anything else', () => {
    expect(isExportableFieldName('title')).toBe(true);
  });
});
