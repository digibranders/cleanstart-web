import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { humaniseFilename } from '../lib/humanise-filename';
import { sanitizeSvgBuffer } from '../lib/sanitize-svg';
import { ALLOWED_MIME_TYPES, checkUploadSize } from '../lib/upload-limits';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const FOLDERS = [
  'web/blog',
  'web/news',
  'web/guide',
  'web/resource',
  'web/event',
  'web/webinar',
  'web/job',
  'web/author',
  'web/about',
  'web/page',
  'web/general',
] as const;

const isImage = (mimeType: string | undefined | null): boolean =>
  Boolean(mimeType?.startsWith('image/'));

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'folder', 'mimeType', 'filesize', 'updatedAt'],
    group: 'System',
  },
  access: {
    read: () => true,
    // Authors no longer upload directly — match the rest of the write
    // surface so role escalation is the only path to add media.
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  upload: {
    staticDir: path.resolve(dirname, '../../../media'),
    mimeTypes: [...ALLOWED_MIME_TYPES],
    resizeOptions: {
      width: 2400,
      withoutEnlargement: true,
    },
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    imageSizes: [
      { name: 'thumb', width: 400, withoutEnlargement: true },
      { name: 'card', width: 800, withoutEnlargement: true },
      { name: 'hero', width: 1600, withoutEnlargement: true },
    ],
  },
  fields: [
    // Custom chrome — mirrors the blog editor's MediaField card with
    // inline filename rename + copy URL + open-in-tab + alt readout.
    // The default Payload `.file-field` is hidden via CSS in
    // `_media.scss` so this component owns the file header surface.
    {
      name: '_chrome',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/MediaSelfChrome.tsx#MediaSelfChrome',
          },
        },
      },
    },
    {
      name: '_sizeWarning',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/MediaSizeWarningField.tsx#MediaSizeWarningField',
          },
        },
      },
    },
    {
      name: 'folder',
      type: 'select',
      options: FOLDERS.map((folder) => ({ label: folder, value: folder })),
      defaultValue: 'web/general',
      admin: {
        description: 'Storage folder. Re-classify if the upload was placed in the wrong bucket.',
      },
    },
    {
      name: 'decorative',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Purely decorative image (no informational content). When true, alt text is hidden and the image renders with empty alt per WCAG 2.2 SC 1.1.1.',
        condition: (_data, siblingData) => isImage(siblingData?.mimeType),
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'Required for non-decorative images. Pre-filled from the humanised filename — review before publish.',
        condition: (_data, siblingData) =>
          isImage(siblingData?.mimeType) && siblingData?.decorative !== true,
      },
      validate: (
        value: string | string[] | null | undefined,
        { siblingData }: { siblingData?: { mimeType?: string; decorative?: boolean } },
      ): true | string => {
        if (!isImage(siblingData?.mimeType)) return true;
        if (siblingData?.decorative === true) return true;
        if (typeof value === 'string' && value.trim().length > 0) return true;
        return 'Alt text is required for non-decorative images.';
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Optional caption shown beneath the image where supported.' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Photographer / source attribution.' },
    },
    {
      type: 'group',
      name: 'focalPoint',
      admin: {
        description:
          'Smart-crop focal point as percentages (0–100). Drives OG-image and 1:1 thumbnail crops.',
        condition: (_data, siblingData) => isImage(siblingData?.mimeType),
      },
      fields: [
        {
          name: 'x',
          type: 'number',
          defaultValue: 50,
          min: 0,
          max: 100,
          admin: { width: '50%' },
        },
        {
          name: 'y',
          type: 'number',
          defaultValue: 50,
          min: 0,
          max: 100,
          admin: { width: '50%' },
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const file = req.file;
        if (!file) return data;
        const result = checkUploadSize(file.mimetype, file.size);
        if (!result.ok) {
          throw new Error(result.reason);
        }
        // Sanitize SVGs in place — DOMPurify-strip <script>, on* handlers,
        // <foreignObject>, and javascript:/data:/vbscript: hrefs before the
        // file is persisted. Without this, an uploaded SVG renders as XSS
        // anywhere it's embedded inline.
        if (file.mimetype === 'image/svg+xml' && file.data) {
          const original = Buffer.isBuffer(file.data)
            ? file.data
            : Buffer.from(file.data as Uint8Array);
          const cleaned = sanitizeSvgBuffer(original);
          file.data = cleaned;
          file.size = cleaned.byteLength;
        }
        return data;
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (data?.alt || data?.decorative) return data;
        if (!isImage(data?.mimeType)) return data;
        if (typeof data?.filename !== 'string') return data;
        const guess = humaniseFilename(data.filename);
        if (guess.length === 0) return data;
        return { ...data, alt: guess };
      },
    ],
  },
  timestamps: true,
};
