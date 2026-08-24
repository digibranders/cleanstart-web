import { describe, expect, it } from 'vitest';

import {
  collapseCitations,
  collapseGuideFaqs,
  collapseKeywords,
  normalizeWebflowGuide,
} from './guides-normalize';

/** Build the expected `answer` richText value for a single-paragraph string. */
const lexicalAnswer = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      children: [
        { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })),
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
});

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
      { question: 'What is X?', answer: lexicalAnswer('X is a thing.') },
      { question: 'What is Z?', answer: lexicalAnswer('Z is a thing.') },
    ]);
  });

  it('returns [] when no slots are filled', () => {
    expect(collapseGuideFaqs({})).toEqual([]);
  });

  it('splits a blank-line-separated answer into one paragraph per block', () => {
    const result = collapseGuideFaqs({
      Q1: 'Multi-paragraph?',
      Ans1: 'First paragraph,\nstill first.\n\nSecond paragraph.',
    });
    expect(result).toEqual([
      {
        question: 'Multi-paragraph?',
        answer: lexicalAnswer('First paragraph, still first.', 'Second paragraph.'),
      },
    ]);
  });

  it('drops blank-line-delimited segments that are whitespace-only', () => {
    const result = collapseGuideFaqs({
      Q1: 'Edge case?',
      Ans1: '\n\n  \n\nReal paragraph.',
    });
    expect(result).toEqual([
      { question: 'Edge case?', answer: lexicalAnswer('Real paragraph.') },
    ]);
  });
});

describe('collapseKeywords', () => {
  it('returns one string per filled slot', () => {
    expect(
      collapseKeywords({
        'Article keyword 1': 'sbom',
        'Article keyword 2': '',
        'Article keyword 3': '  container security  ',
      }),
    ).toEqual(['sbom', 'container security']);
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
  it('returns all arrays for a fully-populated row', () => {
    const result = normalizeWebflowGuide({
      Q1: 'Why?',
      Ans1: 'Because.',
      'Article keyword 1': 'sbom',
      'Article Mentions 1': 'https://example.com',
    });
    expect(result.faqs).toHaveLength(1);
    expect(result.keywords).toEqual(['sbom']);
    expect(result.citations).toHaveLength(1);
  });

  it('returns empty arrays for an empty row', () => {
    expect(normalizeWebflowGuide({})).toEqual({
      faqs: [],
      keywords: [],
      citations: [],
    });
  });
});
