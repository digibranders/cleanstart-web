export type ParsedFaq = {
  question: string;
  answerParagraphs: string[];
};

const QUESTION_LINE = /^\s*(?:(?:\d+[.)])|(?:Q[:.]))?\s*(.+\?)\s*$/;

const stripAnswerPrefix = (line: string): string =>
  line.replace(/^\s*A[:.]\s*/, '').trimEnd();

/**
 * Parse a pasted block of plain-text Q&A into structured pairs.
 *
 * A line counts as a question when it ends in `?`. An optional leading
 * `1.` / `2)` / `Q:` prefix is stripped. Everything between a question
 * line and the next question line becomes the answer; blank lines split
 * answer paragraphs, consecutive non-blank lines join with a single
 * space (so a paragraph wrapped at 80 cols still arrives as one
 * paragraph).
 */
export const parseFaqBulk = (input: string): ParsedFaq[] => {
  if (!input) return [];
  const lines = input.replace(/\r\n?/g, '\n').split('\n');

  type Pending = { question: string; buffer: string[] };
  const result: ParsedFaq[] = [];
  let current: Pending | null = null;
  let paragraph: string[] = [];

  const flushParagraph = (): void => {
    if (!current) {
      paragraph = [];
      return;
    }
    if (paragraph.length === 0) return;
    current.buffer.push(paragraph.join(' '));
    paragraph = [];
  };

  const finalise = (): void => {
    if (!current) return;
    flushParagraph();
    result.push({ question: current.question, answerParagraphs: current.buffer });
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    const questionMatch = trimmed.endsWith('?') ? trimmed.match(QUESTION_LINE) : null;

    if (questionMatch) {
      const captured = questionMatch[1];
      if (captured) {
        finalise();
        current = { question: captured.trim(), buffer: [] };
        continue;
      }
    }

    if (trimmed === '') {
      flushParagraph();
      continue;
    }

    paragraph.push(stripAnswerPrefix(trimmed));
  }

  finalise();
  return result;
};
