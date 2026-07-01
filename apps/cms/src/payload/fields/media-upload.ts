import type { Field, FieldHook, Validate } from 'payload';

type Condition = (data: unknown, siblingData: unknown) => boolean;

/**
 * Editor-facing sizing guidance for an image field. Rendered behind an
 * "i" info button next to the field label in the admin so editors know
 * exactly what to upload for the image to render crisply on the website.
 * The numbers are derived from how `apps/web` actually renders the image
 * (next/image `sizes` + container aspect ratio, 2× for retina) — do not
 * invent them. Omit this on non-image (PDF/ZIP) fields.
 */
export type MediaGuidance = {
  /** Recommended intrinsic pixel size, e.g. `'1600 × 900 px'`. */
  dimensions: string;
  /** Aspect-ratio descriptor, e.g. `'16:9 (landscape)'`. */
  aspectRatio: string;
  /** Where/how the image is used, and whether it is cropped to fill. */
  note?: string;
};

export type MediaUploadOptions = {
  /** Field name (e.g. `heroImage`, `photo`, `logo`). */
  name: string;
  /** Optional override for the field label. */
  label?: string;
  /** Whether the relation is required. */
  required?: boolean;
  /** Storage folder used when uploading directly from the field. */
  folderHint?:
    | 'web/blog'
    | 'web/news'
    | 'web/guide'
    | 'web/resource'
    | 'web/case-study'
    | 'web/event'
    | 'web/webinar'
    | 'web/job'
    | 'web/author'
    | 'web/about'
    | 'web/page'
    | 'web/general';
  /** Field description (rendered under the label). */
  description?: string;
  /**
   * MIME types accepted by the upload picker for this field. Defaults to the
   * image set used by editorial covers. Pass a downloadable set
   * (`['application/pdf', 'application/zip', 'application/x-zip-compressed']`)
   * for asset-style fields so the OS file picker exposes PDFs/ZIPs instead
   * of greying them out.
   */
  accept?: readonly string[];
  /**
   * Editor-facing image sizing guidance, shown behind an "i" info button
   * beside the field label. Set only on image fields — leave undefined for
   * downloadable PDF/ZIP asset fields.
   */
  guidance?: MediaGuidance;
  /** Standard Payload admin.condition. */
  condition?: Condition;
  /** Pass through validate. */
  validate?: Validate;
  /** Pass through hooks. */
  hooks?: { beforeChange?: FieldHook[] };
};

/**
 * Configured upload-to-media field. Wraps every `relationTo: 'media'`
 * upload across the CMS so they all share:
 *
 *  - Custom MediaField UI: direct device upload, drag-drop, URL row,
 *    inline alt edit, preview, browse-existing.
 *  - Custom MediaCell list view: 24×24 thumbnail + filename instead of
 *    the default ID column.
 *  - `folderHint` driving where uploads land in the Media folder taxonomy.
 *
 * Schema-equivalent to the old inline `{ type: 'upload', relationTo: 'media' }`
 * — `payload-types.ts` and the underlying database column do not change.
 */
export const mediaUploadField = (opts: MediaUploadOptions): Field => ({
  name: opts.name,
  type: 'upload',
  relationTo: 'media',
  ...(opts.required != null ? { required: opts.required } : {}),
  ...(opts.label ? { label: opts.label } : {}),
  ...(opts.validate ? { validate: opts.validate } : {}),
  ...(opts.hooks ? { hooks: opts.hooks } : {}),
  admin: {
    components: {
      Field: '@/payload/admin/components/MediaField/MediaField.tsx#MediaField',
      Cell: '@/payload/admin/components/MediaField/MediaCell.tsx#MediaCell',
    },
    custom: {
      folderHint: opts.folderHint ?? 'web/general',
      ...(opts.accept ? { accept: opts.accept } : {}),
      ...(opts.guidance ? { guidance: opts.guidance } : {}),
    },
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.condition ? { condition: opts.condition } : {}),
  },
});
