import { describe, expect, it } from 'vitest';

import { scoreKeywordDensity } from './keyword-density';

describe('scoreKeywordDensity', () => {
  it('returns absent for empty keyword', () => {
    const r = scoreKeywordDensity({ keyword: '   ', bodyText: 'a b c' });
    expect(r.band).toBe('absent');
    expect(r.bodyOccurrences).toBe(0);
  });

  it('counts single-word matches with light stemming', () => {
    const r = scoreKeywordDensity({
      keyword: 'container',
      bodyText: 'Containers are great. We sign containers and containerize them.',
    });
    expect(r.bodyOccurrences).toBeGreaterThanOrEqual(2);
  });

  it('matches multi-word phrases with sliding window', () => {
    const r = scoreKeywordDensity({
      keyword: 'software supply chain',
      bodyText:
        'The software supply chain is brittle. Sign every step of the software supply chain.',
    });
    expect(r.bodyOccurrences).toBe(2);
  });

  it('reports body density as percentage with 2-decimal precision', () => {
    const body = `${'word '.repeat(95)}target target target target target`;
    const r = scoreKeywordDensity({ keyword: 'target', bodyText: body });
    expect(r.bodyWords).toBe(100);
    expect(r.bodyOccurrences).toBe(5);
    expect(r.bodyDensity).toBe(5);
  });

  it('classifies density into bands', () => {
    const sweetSpot = `${'word '.repeat(98)}target target`;
    const overused = `${'word '.repeat(80)}${'target '.repeat(20)}`;
    const light = `${'word '.repeat(199)}target`;
    expect(scoreKeywordDensity({ keyword: 'target', bodyText: sweetSpot }).band).toBe('good');
    expect(scoreKeywordDensity({ keyword: 'target', bodyText: overused }).band).toBe('overused');
    expect(scoreKeywordDensity({ keyword: 'target', bodyText: light }).band).toBe('light');
  });

  it('counts presence in title + description independently', () => {
    const r = scoreKeywordDensity({
      keyword: 'sbom',
      bodyText: '',
      title: 'How to sign your SBOM',
      description: 'Step-by-step SBOM signing.',
    });
    expect(r.titleOccurrences).toBe(1);
    expect(r.descriptionOccurrences).toBe(1);
  });

  describe('heading + first-100-words signals', () => {
    it('detects keyword in H2', () => {
      const r = scoreKeywordDensity({
        keyword: 'sbom signing',
        bodyText: 'lorem ipsum',
        headings: [{ level: 2, text: 'Why SBOM signing matters' }],
      });
      expect(r.inH2OrH3).toBe(true);
    });

    it('detects keyword in H3', () => {
      const r = scoreKeywordDensity({
        keyword: 'sbom',
        bodyText: 'lorem',
        headings: [{ level: 3, text: 'SBOM in production' }],
      });
      expect(r.inH2OrH3).toBe(true);
    });

    it('does NOT count H4-H6 toward inH2OrH3', () => {
      const r = scoreKeywordDensity({
        keyword: 'sbom',
        bodyText: 'lorem',
        headings: [
          { level: 4, text: 'SBOM advanced' },
          { level: 5, text: 'SBOM deep' },
        ],
      });
      expect(r.inH2OrH3).toBe(false);
    });

    it('inH2OrH3 false when headings empty', () => {
      const r = scoreKeywordDensity({
        keyword: 'sbom',
        bodyText: 'sbom is everywhere',
      });
      expect(r.inH2OrH3).toBe(false);
    });

    it('first-100-words: detects keyword in first paragraph when provided', () => {
      const r = scoreKeywordDensity({
        keyword: 'sbom',
        bodyText: `${'filler '.repeat(200)}sbom`,
        firstParagraphText: 'This article opens with SBOM front and centre.',
      });
      expect(r.inFirst100Words).toBe(true);
    });

    it('first-100-words: falls back to slicing body when firstParagraphText absent', () => {
      const r = scoreKeywordDensity({
        keyword: 'sbom',
        bodyText: `sbom is the topic. ${'filler '.repeat(300)}`,
      });
      expect(r.inFirst100Words).toBe(true);
    });

    it('first-100-words: returns false when keyword appears only after the window', () => {
      const r = scoreKeywordDensity({
        keyword: 'sbom',
        bodyText: `${'filler '.repeat(120)}sbom appears late`,
      });
      expect(r.inFirst100Words).toBe(false);
    });
  });
});
