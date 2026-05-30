import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Server-side wrapper for the CleanStart code-block toolbar button.
 *
 * Adds a single `<>` button to the fixed toolbar that inserts the CodeBlock
 * decorator (registered via `BlocksFeature({ blocks: [CodeBlock] })`). It
 * replaces the stock inline-code button and stands in for the stock
 * BlocksFeature dropdown, which is hidden in CSS — leaving one unambiguous
 * code affordance instead of two.
 */
export const cleanstartCodeBlockFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/CodeBlockButton/CleanstartCodeBlockFeatureClient.ts#CleanstartCodeBlockFeatureClient',
  },
  key: 'cleanstartCodeBlock',
});
