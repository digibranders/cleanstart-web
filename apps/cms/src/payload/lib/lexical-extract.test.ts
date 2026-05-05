import { describe, expect, it } from 'vitest';

import { extractFromLexical } from './lexical-extract';

const lexical = (children: unknown[]) => ({
  root: { type: 'root', children },
});

const heading = (tag: string, text: string) => ({
  type: 'heading',
  tag,
  children: [{ type: 'text', text }],
});

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});

describe('extractFromLexical', () => {
  it('returns zeros for null/undefined/non-object input', () => {
    expect(extractFromLexical(null)).toEqual({ wordCount: 0, readingMinutes: 0, headings: [] });
    expect(extractFromLexical(undefined)).toEqual({ wordCount: 0, readingMinutes: 0, headings: [] });
    expect(extractFromLexical('not a tree')).toEqual({
      wordCount: 0,
      readingMinutes: 0,
      headings: [],
    });
  });

  it('returns zeros for empty body', () => {
    expect(extractFromLexical(lexical([]))).toEqual({
      wordCount: 0,
      readingMinutes: 0,
      headings: [],
    });
  });

  it('counts words across paragraphs', () => {
    const body = lexical([paragraph('one two three'), paragraph('four five')]);
    const result = extractFromLexical(body);
    expect(result.wordCount).toBe(5);
  });

  it('rounds up reading minutes (≥1 when any words present)', () => {
    const body = lexical([paragraph('exactly ten words including this very specific test sentence here')]);
    const result = extractFromLexical(body);
    expect(result.wordCount).toBe(10);
    expect(result.readingMinutes).toBe(1);
  });

  it('readingMinutes uses 220 wpm by default', () => {
    const longParagraph = paragraph(Array.from({ length: 660 }, (_, i) => `word${i}`).join(' '));
    const result = extractFromLexical(lexical([longParagraph]));
    expect(result.wordCount).toBe(660);
    expect(result.readingMinutes).toBe(3);
  });

  it('respects custom wordsPerMinute', () => {
    const body = lexical([paragraph(Array.from({ length: 100 }, () => 'x').join(' '))]);
    const result = extractFromLexical(body, { wordsPerMinute: 50 });
    expect(result.readingMinutes).toBe(2);
  });

  it('extracts H2-H6 headings with anchors', () => {
    const body = lexical([
      heading('h2', 'Introduction'),
      paragraph('intro body'),
      heading('h3', 'Background'),
      paragraph('detail'),
      heading('h2', 'Conclusion'),
    ]);
    const result = extractFromLexical(body);
    expect(result.headings).toEqual([
      { level: 2, text: 'Introduction', anchor: 'introduction' },
      { level: 3, text: 'Background', anchor: 'background' },
      { level: 2, text: 'Conclusion', anchor: 'conclusion' },
    ]);
  });

  it('skips H1 (page title only)', () => {
    const body = lexical([heading('h1', 'Page title'), heading('h2', 'Real heading')]);
    const result = extractFromLexical(body);
    expect(result.headings).toHaveLength(1);
    expect(result.headings[0]?.text).toBe('Real heading');
  });

  it('disambiguates duplicate heading anchors with -2, -3 suffix', () => {
    const body = lexical([
      heading('h2', 'Setup'),
      heading('h2', 'Setup'),
      heading('h2', 'Setup'),
    ]);
    const result = extractFromLexical(body);
    expect(result.headings.map((h) => h.anchor)).toEqual(['setup', 'setup-2', 'setup-3']);
  });

  it('skips empty headings', () => {
    const body = lexical([heading('h2', '   '), heading('h2', 'Real')]);
    const result = extractFromLexical(body);
    expect(result.headings).toHaveLength(1);
    expect(result.headings[0]?.text).toBe('Real');
  });

  it('handles nested children inside headings (e.g. bold inside h2)', () => {
    const body = lexical([
      {
        type: 'heading',
        tag: 'h2',
        children: [
          { type: 'text', text: 'Why ' },
          { type: 'text', format: 1, text: 'SBOM' },
          { type: 'text', text: ' matters' },
        ],
      },
    ]);
    const result = extractFromLexical(body);
    expect(result.headings).toEqual([
      { level: 2, text: 'Why SBOM matters', anchor: 'why-sbom-matters' },
    ]);
  });
});
