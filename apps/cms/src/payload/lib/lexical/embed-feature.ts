import { createServerFeature } from '@payloadcms/richtext-lexical';

import { EmbedNode } from '@/payload/admin/components/Embed/EmbedNode';

/**
 * Registers the custom EmbedNode into Lexical's node registry and
 * wires up the client-side feature.
 *
 * The node stores all embed metadata (URL, rawHtml, provider, etc.)
 * as primitives in the Lexical JSON — no Payload collection reference,
 * no population hooks.
 *
 * iframe mode  → <iframe> rendered live in the editor.
 * script mode  → static placeholder in the editor; scripts execute on
 *                the live site only.
 *
 * Removing this feature orphans existing embed nodes (they become
 * unknown decorator blocks). A migration would be needed to strip them.
 */
export const cleanstartEmbedFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/Embed/CleanstartEmbedFeatureClient.ts#CleanstartEmbedFeatureClient',
    nodes: [{ node: EmbedNode }],
  },
  key: 'cleanstartEmbed',
});
