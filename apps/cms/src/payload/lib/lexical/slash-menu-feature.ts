import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Server-side wrapper for the CleanStart slash menu.
 *
 * Listens for `/` at the start of a paragraph, opens an anchored
 * popover with the most common block-insert commands. Layered on top
 * of stock Lexical features — Heading, Quote, List, HR, etc. — so
 * removing this feature is a no-op for content already in the doc.
 */
export const cleanstartSlashMenuFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/CleanstartSlashMenuFeatureClient.ts#CleanstartSlashMenuFeatureClient',
  },
  key: 'cleanstartSlashMenu',
});
