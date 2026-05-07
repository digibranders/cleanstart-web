import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Server-side Lexical feature wrapper for the Word / Docs paste
 * normaliser. Registered globally on the `lexicalEditor()` config so
 * it applies to every rich-text field across the CMS.
 *
 * The actual paste interception happens client-side; this wrapper
 * just points Payload at the client-feature module that registers
 * the `RichPastePlugin`.
 */
export const RichPasteFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/RichPasteFeatureClient.ts#RichPasteFeatureClient',
  },
  key: 'richPaste',
});
