import {
  AlignFeature,
  BlockquoteFeature,
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

import { cleanstartLinkPopoverFeature } from './link-popover-feature';
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
      InlineCodeFeature(),
      SubscriptFeature(),
      SuperscriptFeature(),

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
      UploadFeature(),

      // Persistent toolbar — addresses editor reports that bold/italic
      // "weren't working": the default inline-on-selection floater is
      // undiscoverable for editors coming from Word/Webflow.
      FixedToolbarFeature(),
      InlineToolbarFeature(),

      RichPasteFeature(),
    ],
  });
