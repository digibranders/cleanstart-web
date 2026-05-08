import { describe, expect, it } from 'vitest';

import {
  collapseArticleSections,
  collapseCitations,
  collapseGuideFaqs,
  collapseKeywords,
  normalizeWebflowGuide,
} from './guides-normalize';

describe('collapseGuideFaqs', () => {
  it('collapses Q1/Ans1 … Q5/Ans5 pairs and skips half-filled rows', () => {
    const result = collapseGuideFaqs({
      Q1: 'What is X?',
      Ans1: 'X is a thing.',
      Q2: 'What is Y?',
      // Ans2 missing
      Q3: '',
      Ans3: 'Orphan answer.',
      Q4: 'What is Z?',
      Ans4: '  Z is a thing.  ',
    });
    expect(result).toEqual([
      { question: 'What is X?', answer: 'X is a thing.' },
      { question: 'What is Z?', answer: 'Z is a thing.' },
    ]);
  });

  it('returns [] when no slots are filled', () => {
    expect(collapseGuideFaqs({})).toEqual([]);
  });
});

describe('collapseArticleSections', () => {
  it('splits "Heading: body" into structured rows', () => {
    expect(
      collapseArticleSections({
        'Article About 1': 'Why SBOMs matter: They give you provenance.',
      }),
    ).toEqual([
      { heading: 'Why SBOMs matter', body: 'They give you provenance.' },
    ]);
  });

  it('falls back to first-sentence split when no colon', () => {
    expect(
      collapseArticleSections({
        'Article About 1': 'SBOMs matter. Here is why they do.',
      }),
    ).toEqual([{ heading: 'SBOMs matter.', body: 'Here is why they do.' }]);
  });

  it('uses the value as both heading + body when no split is found', () => {
    const result = collapseArticleSections({
      'Article About 1': 'A single short sentence with no terminal punctuation',
    });
    expect(result[0]?.heading).toBe('A single short sentence with no terminal punctuation');
    expect(result[0]?.body).toBe('A single short sentence with no terminal punctuation');
  });

  it('skips empty / whitespace-only slots', () => {
    expect(
      collapseArticleSections({
        'Article About 1': 'Heading: body',
        'Article About 2': '   ',
        'Article About 3': '',
        'Article About 4': 'Another: section',
      }),
    ).toHaveLength(2);
  });
});

describe('collapseKeywords', () => {
  it('returns one entry per filled slot', () => {
    expect(
      collapseKeywords({
        'Article keyword 1': 'sbom',
        'Article keyword 2': '',
        'Article keyword 3': '  container security  ',
      }),
    ).toEqual([{ keyword: 'sbom' }, { keyword: 'container security' }]);
  });
});

describe('collapseCitations', () => {
  it('extracts URL-only citations', () => {
    expect(
      collapseCitations({
        'Article Mentions 1': 'https://nist.gov/sp800-53',
      }),
    ).toEqual([
      {
        label: 'nist.gov',
        url: 'https://nist.gov/sp800-53',
        source: 'nist.gov',
      },
    ]);
  });

  it('parses "Label - URL" into structured rows', () => {
    expect(
      collapseCitations({
        'Article Mentions 1': 'NIST SP 800-53 - https://csrc.nist.gov/publications/detail/sp/800-53',
      }),
    ).toEqual([
      {
        label: 'NIST SP 800-53',
        url: 'https://csrc.nist.gov/publications/detail/sp/800-53',
        source: 'csrc.nist.gov',
      },
    ]);
  });

  it('parses "Label (Source)" into structured rows', () => {
    expect(
      collapseCitations({
        'Article Mentions 1': 'Cybersecurity report (CISA)',
      }),
    ).toEqual([{ label: 'Cybersecurity report', source: 'CISA' }]);
  });

  it('keeps a bare label when no URL or source is detectable', () => {
    expect(
      collapseCitations({
        'Article Mentions 1': 'Just a label without anything else',
      }),
    ).toEqual([{ label: 'Just a label without anything else' }]);
  });
});

describe('normalizeWebflowGuide', () => {
  it('returns all four arrays for a fully-populated row', () => {
    const result = normalizeWebflowGuide({
      Q1: 'Why?',
      Ans1: 'Because.',
      'Article About 1': 'Header: paragraph',
      'Article keyword 1': 'sbom',
      'Article Mentions 1': 'https://example.com',
    });
    expect(result.faqs).toHaveLength(1);
    expect(result.articleSections).toHaveLength(1);
    expect(result.keywords).toEqual([{ keyword: 'sbom' }]);
    expect(result.citations).toHaveLength(1);
  });

  it('returns empty arrays for an empty row', () => {
    expect(normalizeWebflowGuide({})).toEqual({
      faqs: [],
      articleSections: [],
      keywords: [],
      citations: [],
    });
  });
});
