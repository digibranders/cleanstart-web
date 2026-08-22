import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  InlineCodeFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';

import { cleanstartLinkPopoverFeature } from './link-popover-feature';

/**
 * Constrained editor for FAQ answers (Blogs / Guides / Knowledge Base
 * `faqs[].answer`). Deliberately smaller than `cleanstartLexicalEditor()`
 * (../editor-config.ts) — no headings, tables, embeds, uploads, or full code
 * blocks. Schema.org's FAQPage `acceptedAnswer.text` is flattened to plain text
 * for JSON-LD (see `lib/jsonld/faq-page.ts`).
 *
 * Supports inline code, bold, italic, underline, strikethrough, sub/sup,
 * quotes/callouts, lists, and inline links with custom rel.
 */
export const faqAnswerLexicalEditor = (): ReturnType<typeof lexicalEditor> =>
  lexicalEditor({
    features: () => [
      ParagraphFeature(),
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      InlineCodeFeature(),
      SubscriptFeature(),
      SuperscriptFeature(),
      BlockquoteFeature(),
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


