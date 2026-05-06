import { describe, expect, it } from 'vitest';

import { parseFaqBulk } from './faq-bulk-parse';

const FIVE_QUESTION_FIXTURE = `1. How often should SEBI CSCRF audits be conducted?

SEBI typically requires periodic audits aligned with regulatory timelines, but most organizations conduct internal reviews at least annually to maintain continuous compliance readiness.

2. Are cloud environments covered under SEBI CSCRF requirements?

Yes. Any cloud system handling financial data or supporting business operations must comply with the same cybersecurity and monitoring controls as on-premise environments.

3. Does SEBI CSCRF require real-time incident reporting?

Yes. Regulated entities must detect and report cybersecurity incidents within defined timelines, supported by SOC monitoring and documented response processes.

4. Can smaller regulated entities implement a simplified CSCRF model?

SEBI allows proportional implementation based on risk, but all entities must still meet minimum cybersecurity and compliance reporting requirements.

5. How does CSCRF impact outsourced IT and managed service providers?

Organizations remain fully accountable. Third-party providers must follow equivalent cybersecurity controls, and their activities must be monitored and auditable.`;

describe('parseFaqBulk', () => {
  it('returns an empty array for empty input', () => {
    expect(parseFaqBulk('')).toEqual([]);
  });

  it('returns an empty array when no question lines are present', () => {
    expect(parseFaqBulk('Just a sentence.\nAnd another one.')).toEqual([]);
  });

  it('parses the canonical 5-question example into 5 pairs with stripped numbering', () => {
    const parsed = parseFaqBulk(FIVE_QUESTION_FIXTURE);
    expect(parsed).toHaveLength(5);
    const questions = parsed.map((p) => p.question);
    expect(questions).toEqual([
      'How often should SEBI CSCRF audits be conducted?',
      'Are cloud environments covered under SEBI CSCRF requirements?',
      'Does SEBI CSCRF require real-time incident reporting?',
      'Can smaller regulated entities implement a simplified CSCRF model?',
      'How does CSCRF impact outsourced IT and managed service providers?',
    ]);
    for (const pair of parsed) {
      expect(pair.question.endsWith('?')).toBe(true);
      expect(pair.answerParagraphs).toHaveLength(1);
      const [first] = pair.answerParagraphs;
      expect(first ?? '').not.toMatch(/^\d+\./);
      expect((first ?? '').length).toBeGreaterThan(20);
    }
    expect(parsed.map((p) => p.answerParagraphs[0])[1]).toMatch(/^Yes\. Any cloud system/);
  });

  it('preserves multiple answer paragraphs separated by blank lines', () => {
    const input = [
      '1. First question?',
      '',
      'First paragraph of the answer.',
      '',
      'Second paragraph of the answer.',
      '',
      '2. Second question?',
      '',
      'Only one paragraph here.',
    ].join('\n');
    const parsed = parseFaqBulk(input);
    expect(parsed).toEqual([
      {
        question: 'First question?',
        answerParagraphs: [
          'First paragraph of the answer.',
          'Second paragraph of the answer.',
        ],
      },
      {
        question: 'Second question?',
        answerParagraphs: ['Only one paragraph here.'],
      },
    ]);
  });

  it('joins consecutive non-blank lines into a single paragraph', () => {
    const input = [
      '1. Wrapped question?',
      'Line one of the answer',
      'continues on the next line',
      'and finishes here.',
    ].join('\n');
    const parsed = parseFaqBulk(input);
    expect(parsed).toEqual([
      {
        question: 'Wrapped question?',
        answerParagraphs: [
          'Line one of the answer continues on the next line and finishes here.',
        ],
      },
    ]);
  });

  it('accepts Q:/A: prefixes and strips them', () => {
    const input = [
      'Q: What is CSCRF?',
      'A: A SEBI cybersecurity framework.',
      '',
      'Q. What about scope?',
      'A. All regulated entities.',
    ].join('\n');
    expect(parseFaqBulk(input)).toEqual([
      {
        question: 'What is CSCRF?',
        answerParagraphs: ['A SEBI cybersecurity framework.'],
      },
      {
        question: 'What about scope?',
        answerParagraphs: ['All regulated entities.'],
      },
    ]);
  });

  it('normalises CRLF line endings', () => {
    expect(parseFaqBulk('1. CRLF question?\r\n\r\nAnswer line.\r\n')).toEqual([
      { question: 'CRLF question?', answerParagraphs: ['Answer line.'] },
    ]);
  });

  it('allows a question with no following answer (empty answerParagraphs)', () => {
    expect(
      parseFaqBulk('1. Lonely question?\n\n2. Followed by another?\n\nReply.'),
    ).toEqual([
      { question: 'Lonely question?', answerParagraphs: [] },
      { question: 'Followed by another?', answerParagraphs: ['Reply.'] },
    ]);
  });

  it('strips trailing whitespace from question lines', () => {
    expect(parseFaqBulk('1.  Padded question?   \n\nAnswer.')).toEqual([
      { question: 'Padded question?', answerParagraphs: ['Answer.'] },
    ]);
  });
});
