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
 * (../editor-config.ts) — no headings, tables, embeds, uploads, or code
 * blocks. Schema.org's FAQPage `acceptedAnswer.text` is meant to stay
 * simple, and JSON-LD flattens this to plain text anyway (see
 * `lib/jsonld/faq-page.ts`), so any richer structure would be silently
 * discarded there.
 *
 * `LinkFeature`'s `rel` field mirrors `cleanstartLexicalEditor()`'s so
 * link-rel handling stays consistent across both editors.
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

