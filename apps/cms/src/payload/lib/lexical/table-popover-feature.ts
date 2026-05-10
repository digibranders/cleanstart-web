import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Server stub for the inline table grid picker. Layered on top of the
 * stock `EXPERIMENTAL_TableFeature` (which registers the table nodes
 * + serialization) to add a custom toolbar button + hover-grid popover
 * that dispatches `INSERT_TABLE_COMMAND` directly. The stock "Table"
 * item inside the `+` dropdown is hidden via CSS so editors only see
 * our inline button — no drawer round-trip when inserting a table.
 */
export const cleanstartTablePopoverFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/CleanstartTablePopoverFeatureClient.ts#CleanstartTablePopoverFeatureClient',
  },
  key: 'cleanstartTablePopover',
});
