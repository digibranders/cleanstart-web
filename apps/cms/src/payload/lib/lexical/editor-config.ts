import {
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  ChecklistFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  RelationshipFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';

import { CodeBlock } from '../../blocks/CodeBlock';
import { InlineCtaBlock } from '../../blocks/InlineCtaBlock';
import { cleanstartAddMenuFeature } from './add-menu-feature';
import { cleanstartCodeBlockFeature } from './code-block-feature';
import { cleanstartEmbedFeature } from './embed-feature';
import { cleanstartInlineImageFeature } from './inline-image-feature';
import { cleanstartLinkPopoverFeature } from './link-popover-feature';
import { cleanstartSlashMenuFeature } from './slash-menu-feature';
import { cleanstartTablePopoverFeature } from './table-popover-feature';
import { RichPasteFeature } from './rich-paste-feature';

export const cleanstartLexicalEditor = () =>
  lexicalEditor({
    features: () => [
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),

      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      SubscriptFeature(),
      SuperscriptFeature(),
      InlineCodeFeature(),

      BlockquoteFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      ChecklistFeature(),
      HorizontalRuleFeature(),
      EXPERIMENTAL_TableFeature(),
      cleanstartTablePopoverFeature(),
      AlignFeature(),
      IndentFeature(),

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
      RelationshipFeature(),
      cleanstartEmbedFeature(),
      cleanstartAddMenuFeature(),

      // Embedded blocks inside rich text. CodeBlock reuses the page-builder
      // block schema 1:1; InlineCtaBlock is body-only and inserted via the
      // slash menu (see SlashMenuPlugin). Both render through the `block`
      // branch of the web renderLexical.
      BlocksFeature({ blocks: [CodeBlock, InlineCtaBlock] }),

      // Single `<>` toolbar button that inserts the CodeBlock above. It
      // takes the slot the inline-code button used to occupy and stands in
      // for the stock BlocksFeature dropdown (hidden in _lexical-toolbar.scss),
      // so editors see one unambiguous code affordance instead of two.
      cleanstartCodeBlockFeature(),

      // Per-placement metadata fields. They live on each upload node's
      // `fields` object inside the Lexical JSON — no Media collection
      // schema change. `alt` defaults from the linked Media doc's own
      // `alt` on insertion (via the inline-image plugin) and is
      // editable per placement so the same image can carry a different
      // contextual alt in different posts.
      UploadFeature({
        collections: {
          media: {
            fields: [
              {
                name: 'alt',
                type: 'text',
                label: 'Alt text (this placement)',
                admin: {
                  description:
                    'Per-placement alt. Defaults from the Media library on insert; override here for context.',
                },
              },
              {
                name: 'caption',
                type: 'text',
                label: 'Caption',
              },
              {
                name: 'alignment',
                type: 'select',
                defaultValue: 'center',
                options: [
                  { label: 'Left', value: 'left' },
                  { label: 'Center', value: 'center' },
                  { label: 'Right', value: 'right' },
                  { label: 'Full-width', value: 'full' },
                ],
              },
              {
                name: 'size',
                type: 'select',
                defaultValue: 'large',
                options: [
                  { label: 'Small', value: 'small' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Large', value: 'large' },
                  { label: 'Full', value: 'full' },
                ],
              },
              {
                name: 'decorative',
                type: 'checkbox',
                label: 'Decorative (suppress alt requirement)',
              },
            ],
          },
        },
      }),

      // Custom inline-image surface: paste/drop direct upload, a
      // three-tab insert dialog (Device / Browse / URL), and a slash
      // menu entry — all bypassing the default media browser modal.
      // Layered on top of UploadFeature: it still owns the node,
      // serialization, and SSR.
      cleanstartInlineImageFeature(),

      // Persistent toolbar — addresses editor reports that bold/italic
      // "weren't working": the default inline-on-selection floater is
      // undiscoverable for editors coming from Word/Webflow.
      FixedToolbarFeature(),
      InlineToolbarFeature(),

      RichPasteFeature(),

      // Wave 7 — type `/` at the start of a paragraph to open an
      // anchored block-insert popover (Heading 2/3, Quote, lists, HR).
      // Layered on top of the stock features it dispatches into.
      cleanstartSlashMenuFeature(),

    ],
  });
