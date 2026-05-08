import { describe, expect, it } from 'vitest';

import { buildKnowsAboutEntries, resolveTopicArea } from './topic-areas';

describe('resolveTopicArea', () => {
  it('returns a DefinedTerm with sameAs for a curated alias', () => {
    expect(resolveTopicArea('Kubernetes')).toEqual({
      value: {
        '@type': 'DefinedTerm',
        name: 'Kubernetes',
        sameAs: 'https://www.wikidata.org/wiki/Q22661306',
      },
    });
    expect(resolveTopicArea('k8s')).toMatchObject({
      value: { name: 'Kubernetes' },
    });
  });

  it('case-insensitive + whitespace-tolerant', () => {
    expect(resolveTopicArea('  CYBERSECURITY  ')).toMatchObject({
      value: { name: 'Cybersecurity' },
    });
  });

  it('returns plain string for unmatched topics', () => {
    expect(resolveTopicArea('Quantum cryptography')).toEqual({
      value: 'Quantum cryptography',
    });
  });

  it('returns null for empty / non-string input', () => {
    expect(resolveTopicArea('')).toBeNull();
    expect(resolveTopicArea('   ')).toBeNull();
    expect(resolveTopicArea(null)).toBeNull();
    expect(resolveTopicArea(42)).toBeNull();
  });
});

describe('buildKnowsAboutEntries', () => {
  it('produces a mixed array of DefinedTerms and plain strings', () => {
    const entries = buildKnowsAboutEntries(['Kubernetes', 'Quantum cryptography']);
    expect(entries).toEqual([
      { '@type': 'DefinedTerm', name: 'Kubernetes', sameAs: expect.stringContaining('Q22661306') },
      'Quantum cryptography',
    ]);
  });

  it('drops empty / null entries', () => {
    expect(buildKnowsAboutEntries(['', null, 'devops'])).toEqual([
      expect.objectContaining({ '@type': 'DefinedTerm', name: 'DevOps' }),
    ]);
  });

  it('dedupes by canonical name', () => {
    const entries = buildKnowsAboutEntries(['Kubernetes', 'k8s', 'KUBERNETES']);
    expect(entries).toHaveLength(1);
  });
});
