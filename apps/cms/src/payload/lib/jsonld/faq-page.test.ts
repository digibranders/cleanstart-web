import { describe, expect, it } from 'vitest';

import { buildFaqPageBlob } from './faq-page';

const PAGE_ID = 'https://cleanstart.com/blogs/example';

const lexicalAnswer = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
});

describe('buildFaqPageBlob', () => {
  it('returns null for missing / empty / partial entries', () => {
    expect(buildFaqPageBlob(PAGE_ID, null)).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: 'Q', answer: lexicalAnswer('') }])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: '', answer: lexicalAnswer('A') }])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: null, answer: lexicalAnswer('A') }])).toBeNull();
  });

  it('drops partial rows but keeps complete ones', () => {
    const blob = buildFaqPageBlob(PAGE_ID, [
      { question: 'Q1', answer: lexicalAnswer('A1') },
      { question: '', answer: lexicalAnswer('A2') },
      { question: 'Q3', answer: lexicalAnswer('A3') },
    ]);
    expect(blob).not.toBeNull();
    expect((blob as unknown as { mainEntity: unknown[] }).mainEntity).toHaveLength(2);
  });

  it('emits a well-formed FAQPage with @id at #faq, flattening richText to plain text', () => {
    expect(
      buildFaqPageBlob(PAGE_ID, [{ question: 'Why?', answer: lexicalAnswer('Because.') }]),
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
