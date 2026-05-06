import { RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { LexicalDiffComponent as LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'
import { RichPasteFeatureClient as RichPasteFeatureClient_ed3a5de8bf0054673d45b1536bad59f3 } from '@/payload/admin/components/RichPasteFeatureClient.ts'
import { InlineToolbarFeatureClient as InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { HorizontalRuleFeatureClient as HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { UploadFeatureClient as UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { BlockquoteFeatureClient as BlockquoteFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { RelationshipFeatureClient as RelationshipFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ChecklistFeatureClient as ChecklistFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { IndentFeatureClient as IndentFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { AlignFeatureClient as AlignFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { HeadingFeatureClient as HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ParagraphFeatureClient as ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { InlineCodeFeatureClient as InlineCodeFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { SuperscriptFeatureClient as SuperscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { SubscriptFeatureClient as SubscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { StrikethroughFeatureClient as StrikethroughFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { UnderlineFeatureClient as UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { ItalicFeatureClient as ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'
import { PermalinkField as PermalinkField_ea9054c021397c838baff6eeae171a19 } from '@/payload/admin/components/PermalinkField.tsx'
import { SeoTitleField as SeoTitleField_1a192963c1119f2a2e3e8c2143d913c7 } from '@/payload/admin/components/SeoTitleField.tsx'
import { SeoDescriptionField as SeoDescriptionField_9696c1be1903d357f63d23951e7963fc } from '@/payload/admin/components/SeoDescriptionField.tsx'
import { SeoIndexableField as SeoIndexableField_ff3cc07c91d10b5899370ac0f262f1fb } from '@/payload/admin/components/SeoIndexableField.tsx'
import { SerpPreviewField as SerpPreviewField_243778961d714dd69072cd09f703a734 } from '@/payload/admin/components/SerpPreviewField.tsx'
import { LeadsCsvTruncationBanner as LeadsCsvTruncationBanner_e22b2ed864c6d0e2876f5238fb489adb } from '@/payload/admin/components/LeadsCsvTruncationBanner.tsx'
import { FaqBulkPaste as FaqBulkPaste_34cc49081ef861ac2f0f2bcdbdf5a9d4 } from '@/payload/admin/components/FaqBulkPaste.tsx'
import { FaqRowLabel as FaqRowLabel_76d07ae44e07fadd7fac0306f5f777f3 } from '@/payload/admin/components/FaqRowLabel.tsx'
import { TocRowLabel as TocRowLabel_78171b8b574c1f3ba9edec9842dd5d0b } from '@/payload/admin/components/TocRowLabel.tsx'
import { Icon as Icon_c822e198d4078a1912cce52e024df304 } from '../../../payload/admin/Icon.tsx'
import { Logo as Logo_dcbc6ddf8fe8d700973cf459e9b44aa4 } from '../../../payload/admin/Logo.tsx'
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from '@payloadcms/storage-s3/client'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
  "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
  "@/payload/admin/components/RichPasteFeatureClient.ts#RichPasteFeatureClient": RichPasteFeatureClient_ed3a5de8bf0054673d45b1536bad59f3,
  "@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient": InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient": HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#UploadFeatureClient": UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#BlockquoteFeatureClient": BlockquoteFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#RelationshipFeatureClient": RelationshipFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#ChecklistFeatureClient": ChecklistFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#OrderedListFeatureClient": OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#UnorderedListFeatureClient": UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#IndentFeatureClient": IndentFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#AlignFeatureClient": AlignFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#HeadingFeatureClient": HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#ParagraphFeatureClient": ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#InlineCodeFeatureClient": InlineCodeFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#SuperscriptFeatureClient": SuperscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#SubscriptFeatureClient": SubscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#StrikethroughFeatureClient": StrikethroughFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#UnderlineFeatureClient": UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#BoldFeatureClient": BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@payloadcms/richtext-lexical/client#ItalicFeatureClient": ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
  "@/payload/admin/components/PermalinkField.tsx#PermalinkField": PermalinkField_ea9054c021397c838baff6eeae171a19,
  "@/payload/admin/components/SeoTitleField.tsx#SeoTitleField": SeoTitleField_1a192963c1119f2a2e3e8c2143d913c7,
  "@/payload/admin/components/SeoDescriptionField.tsx#SeoDescriptionField": SeoDescriptionField_9696c1be1903d357f63d23951e7963fc,
  "@/payload/admin/components/SeoIndexableField.tsx#SeoIndexableField": SeoIndexableField_ff3cc07c91d10b5899370ac0f262f1fb,
  "@/payload/admin/components/SerpPreviewField.tsx#SerpPreviewField": SerpPreviewField_243778961d714dd69072cd09f703a734,
  "@/payload/admin/components/LeadsCsvTruncationBanner.tsx#LeadsCsvTruncationBanner": LeadsCsvTruncationBanner_e22b2ed864c6d0e2876f5238fb489adb,
  "@/payload/admin/components/FaqBulkPaste.tsx#FaqBulkPaste": FaqBulkPaste_34cc49081ef861ac2f0f2bcdbdf5a9d4,
  "@/payload/admin/components/FaqRowLabel.tsx#FaqRowLabel": FaqRowLabel_76d07ae44e07fadd7fac0306f5f777f3,
  "@/payload/admin/components/TocRowLabel.tsx#TocRowLabel": TocRowLabel_78171b8b574c1f3ba9edec9842dd5d0b,
  "./payload/admin/Icon.tsx#Icon": Icon_c822e198d4078a1912cce52e024df304,
  "./payload/admin/Logo.tsx#Logo": Logo_dcbc6ddf8fe8d700973cf459e9b44aa4,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
