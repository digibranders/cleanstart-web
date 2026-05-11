import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Server-side wrapper for the CleanStart inline-image surface.
 *
 * Layered on top of Payload's stock `UploadFeature` — it does not
 * register a new lexical node. Instead the client feature mounts a
 * plugin that:
 *
 *   - Intercepts `PASTE` / `DROP` of `image/*` files at high priority,
 *     uploads via `/api/media`, and inserts an `upload` node with
 *     per-placement `fields` (alt inherited from the Media doc,
 *     alignment defaulting to center, size to large).
 *   - Listens for a slash-menu / toolbar dispatch to open a three-tab
 *     custom insert dialog (Device / Browse / URL).
 *
 * Removing this feature is a no-op for existing content — all images
 * remain stock `upload` nodes.
 */
export const cleanstartInlineImageFeature = createServerFeature({
  feature: {
    ClientFeature:
      '@/payload/admin/components/InlineImage/CleanstartInlineImageFeatureClient.ts#CleanstartInlineImageFeatureClient',
  },
  key: 'cleanstartInlineImage',
});
