import { lexicalToPlainText } from '../lexical/to-plain-text';
import type { JsonLdBlob } from './types';

export interface FaqEntry {
  readonly question?: string | null;
  readonly answer?: unknown;
}

/**
 * Build a FAQPage blob from a `faqs[]` array. Returns null when no
 * complete (question + answer) entries exist — emitting an empty
 * mainEntity[] is a Schema.org validator error.
 *
 * `answer` is Lexical richText JSON (bold/italic/links/lists) — flattened
 * to plain text via `lexicalToPlainText` since `acceptedAnswer.text` must
 * be a plain string per Schema.org.
 */
export const buildFaqPageBlob = (
  pageId: string,
  faqs: readonly FaqEntry[] | null | undefined,
): JsonLdBlob | null => {
  const entries = (faqs ?? [])
    .map((f) => ({
      question: typeof f.question === 'string' ? f.question : '',
      answerText: lexicalToPlainText(f.answer),
    }))
    .filter((f) => f.question.length > 0 && f.answerText.length > 0)
    .map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answerText,
      },
    }));

  if (entries.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageId}#faq`,
    mainEntity: entries,
  };
};
