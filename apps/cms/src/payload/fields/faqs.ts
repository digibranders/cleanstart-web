import type { Field } from 'payload';

import { faqAnswerLexicalEditor } from '../lib/lexical/faq-answer-editor';

/**
 * Shared `faqsBulkPaste` (UI-only paste helper) + `faqs` array field used
 * identically by Blogs, Guides, and Knowledge Base. `answer` is richText
 * (see `faqAnswerLexicalEditor`) — bold/italic/links/lists/soft breaks
 * only. JSON-LD flattens it to plain text for `acceptedAnswer.text` (see
 * `lib/jsonld/faq-page.ts`).
 */
export const faqsBulkPasteField: Field = {
  name: 'faqsBulkPaste',
  type: 'ui',
  admin: {
    components: {
      Field: {
        path: '@/payload/admin/components/FaqBulkPaste.tsx#FaqBulkPaste',
        clientProps: { targetField: 'faqs' },
      },
    },
  },
};

export const faqsField: Field = {
  name: 'faqs',
  type: 'array',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    // Start collapsed — a formatted, potentially multi-paragraph answer
    // makes an expanded 5-FAQ list dominate the form; the row summary
    // already shows the question text, so collapsed is the better default.
    initCollapsed: true,
    components: {
      RowLabel: '@/payload/admin/components/FaqRowLabel.tsx#FaqRowLabel',
    },
  },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true, editor: faqAnswerLexicalEditor() },
  ],
};
