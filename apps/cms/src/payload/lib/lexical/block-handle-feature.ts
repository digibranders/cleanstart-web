import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Wave 7 part 2 — Block-handle drag affordance. Renders a left-rail
 * grip next to the hovered top-level block; lets editors drag whole
 * blocks (paragraph, heading, list, quote) to reorder.
 *
 * Built on Lexical's experimental DraggableBlockPlugin; our chrome
 * owns the visual + interaction, the plugin owns the caret math.
 */
export const cleanstartBlockHandleFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/CleanstartBlockHandleFeatureClient.ts#CleanstartBlockHandleFeatureClient',
  },
  key: 'cleanstartBlockHandle',
});
