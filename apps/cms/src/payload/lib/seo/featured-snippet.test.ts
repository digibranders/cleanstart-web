import { describe, expect, it } from 'vitest';

import { detectFeaturedSnippetCandidates } from './featured-snippet';

const wrap = (children: unknown[]) => ({ root: { children } });
const heading = (tag: string, text: string) => ({
  type: 'heading',
  tag,
  children: [{ text }],
});
const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ text }],
});

describe('detectFeaturedSnippetCandidates', () => {
  it('returns [] for an empty body', () => {
    expect(detectFeaturedSnippetCandidates(null)).toEqual({ candidates: [], best: null });
    expect(detectFeaturedSnippetCandidates({})).toEqual({ candidates: [], best: null });
  });

  it('detects an H2 question + ideal-length answer as great', () => {
    const ideal = 'Word '.repeat(50).trim();
    const report = detectFeaturedSnippetCandidates(
      wrap([heading('h2', 'What is an SBOM?'), paragraph(ideal)]),
    );
    expect(report.candidates).toEqual([
      expect.objectContaining({
        question: 'What is an SBOM?',
        answerWordCount: 50,
        quality: 'great',
      }),
    ]);
    expect(report.best).toBe('great');
  });

  it('marks short answers as okay', () => {
    const short = 'Word '.repeat(30).trim();
    const report = detectFeaturedSnippetCandidates(
      wrap([heading('h2', 'Why sign SBOMs?'), paragraph(short)]),
    );
    expect(report.candidates[0]?.quality).toBe('okay');
    expect(report.best).toBe('okay');
  });

  it('marks tiny / huge answers as weak', () => {
    const tiny = 'Word '.repeat(10).trim();
    const huge = 'Word '.repeat(120).trim();
    const tinyReport = detectFeaturedSnippetCandidates(
      wrap([heading('h2', 'Q?'), paragraph(tiny)]),
    );
    const hugeReport = detectFeaturedSnippetCandidates(
      wrap([heading('h2', 'Q?'), paragraph(huge)]),
    );
    expect(tinyReport.candidates[0]?.quality).toBe('weak');
    expect(hugeReport.candidates[0]?.quality).toBe('weak');
  });

  it('skips non-question H2s', () => {
    const report = detectFeaturedSnippetCandidates(
      wrap([heading('h2', 'A statement'), paragraph('x'.repeat(50))]),
    );
    expect(report.candidates).toEqual([]);
  });

  it('skips H2 not immediately followed by a paragraph', () => {
    const report = detectFeaturedSnippetCandidates(
      wrap([
        heading('h2', 'Why?'),
        heading('h3', 'Sub-heading'),
        paragraph('text'),
      ]),
    );
    expect(report.candidates).toEqual([]);
  });

  it('handles multiple Q/A pairs and returns best across them', () => {
    const ideal = 'Word '.repeat(50).trim();
    const tiny = 'Word '.repeat(10).trim();
    const report = detectFeaturedSnippetCandidates(
      wrap([
        heading('h2', 'Q1?'),
        paragraph(tiny),
        heading('h2', 'Q2?'),
        paragraph(ideal),
      ]),
    );
    expect(report.candidates).toHaveLength(2);
    expect(report.best).toBe('great');
  });

  it('also picks up H3 questions', () => {
    const ideal = 'Word '.repeat(50).trim();
    const report = detectFeaturedSnippetCandidates(
      wrap([heading('h3', 'What about H3?'), paragraph(ideal)]),
    );
    expect(report.candidates).toHaveLength(1);
  });
});
