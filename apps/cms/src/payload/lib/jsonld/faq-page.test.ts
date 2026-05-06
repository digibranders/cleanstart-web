import { describe, expect, it } from 'vitest';

import { buildFaqPageBlob } from './faq-page';

const PAGE_ID = 'https://cleanstart.com/blogs/example';

describe('buildFaqPageBlob', () => {
  it('returns null for missing / empty / partial entries', () => {
    expect(buildFaqPageBlob(PAGE_ID, null)).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: 'Q', answer: '' }])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: '', answer: 'A' }])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: null, answer: 'A' }])).toBeNull();
  });

  it('drops partial rows but keeps complete ones', () => {
    const blob = buildFaqPageBlob(PAGE_ID, [
      { question: 'Q1', answer: 'A1' },
      { question: '', answer: 'A2' },
      { question: 'Q3', answer: 'A3' },
    ]);
    expect(blob).not.toBeNull();
    expect((blob as unknown as { mainEntity: unknown[] }).mainEntity).toHaveLength(2);
  });

  it('emits a well-formed FAQPage with @id at #faq', () => {
    expect(
      buildFaqPageBlob(PAGE_ID, [
        { question: 'Why?', answer: 'Because.' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${PAGE_ID}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Why?',
          acceptedAnswer: { '@type': 'Answer', text: 'Because.' },
        },
      ],
    });
  });
});
