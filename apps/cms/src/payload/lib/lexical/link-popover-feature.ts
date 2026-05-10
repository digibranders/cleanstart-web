import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Server-side wrapper for the inline link-popover client feature.
 * Layered on top of the stock `LinkFeature` to replace its drawer-based
 * editor with a small floating popover anchored next to the selection.
 *
 * Stock `LinkFeature` stays mounted (we keep its `LinkNode`, command
 * handler, autolink, clickable plugin, and HTML serialization). The
 * client feature intercepts `TOGGLE_LINK_WITH_MODAL_COMMAND` at high
 * priority so the drawer never opens, and renders the popover in the
 * same `floatingAnchorElem` slot.
 */
export const cleanstartLinkPopoverFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/CleanstartLinkPopoverFeatureClient.ts#CleanstartLinkPopoverFeatureClient',
  },
  key: 'cleanstartLinkPopover',
});
