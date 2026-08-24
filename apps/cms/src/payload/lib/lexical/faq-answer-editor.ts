import {
  BoldFeature,
  FixedToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';

import { cleanstartLinkPopoverFeature } from './link-popover-feature';

/**
 * Constrained editor for FAQ answers (Blogs / Guides / Knowledge Base
 * `faqs[].answer`). Deliberately smaller than `cleanstartLexicalEditor()`
 * (../editor-config.ts) — no headings, tables, embeds, uploads, code
 * blocks, or blockquotes. Schema.org's FAQPage `acceptedAnswer.text` is
 * flattened to plain text for JSON-LD (see `lib/jsonld/faq-page.ts`),
 * so any richer structure would be silently discarded there — this
 * feature set is intentionally scoped to bold, italic, links, and
 * ordered/unordered lists only.
 */
export const faqAnswerLexicalEditor = (): ReturnType<typeof lexicalEditor> =>
  lexicalEditor({
    features: () => [
      ParagraphFeature(),
      BoldFeature(),
      ItalicFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      LinkFeature({
        fields: [
          {
            name: 'rel',
            type: 'select',
            defaultValue: 'follow',
            options: [
              { label: 'follow', value: 'follow' },
              { label: 'nofollow', value: 'nofollow' },
              { label: 'sponsored', value: 'sponsored' },
              { label: 'ugc', value: 'ugc' },
            ],
          },
        ],
      }),
      cleanstartLinkPopoverFeature(),
      FixedToolbarFeature(),
    ],
  });
