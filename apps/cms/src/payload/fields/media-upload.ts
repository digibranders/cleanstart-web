import type { Field, FieldHook, Validate } from 'payload';

type Condition = (data: unknown, siblingData: unknown) => boolean;

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
    },
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.condition ? { condition: opts.condition } : {}),
  },
});
