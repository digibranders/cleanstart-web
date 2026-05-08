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
});
