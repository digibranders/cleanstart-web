import type { JsonLdBlob } from './types';

export interface FaqEntry {
  readonly question?: string | null;
  readonly answer?: string | null;
}

/**
 * Build a FAQPage blob from a `faqs[]` array. Returns null when no
 * complete (question + answer) entries exist — emitting an empty
 * mainEntity[] is a Schema.org validator error.
 */
export const buildFaqPageBlob = (
  pageId: string,
  faqs: readonly FaqEntry[] | null | undefined,
): JsonLdBlob | null => {
  const entries = (faqs ?? [])
    .filter(
      (f): f is { question: string; answer: string } =>
        typeof f.question === 'string' &&
        f.question.length > 0 &&
        typeof f.answer === 'string' &&
        f.answer.length > 0,
    )
    .map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
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
