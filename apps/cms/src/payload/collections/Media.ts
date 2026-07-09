import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { ValidationError } from 'payload';

import { isAdminOrEditor } from '../access';
import { humaniseFilename } from '../lib/humanise-filename';
import {
  buildMediaFilename,
  canonicalExtensionForMime,
  pickSlugSource,
  shortHash,
} from '../lib/media-filename';
import { sanitizeSvgBuffer } from '../lib/sanitize-svg';
import { ALLOWED_MIME_TYPES, checkUploadSize } from '../lib/upload-limits';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const FOLDERS = [
  'web/blog',
  'web/news',
  'web/guide',
  'web/resource',
  'web/case-study',
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

// Reject any update that changes `filename` without attaching a new file.
// Renaming the doc would update media.url to a key that does not exist in R2
// (the s3-storage plugin only writes to R2 when req.file is present), and the
// derived `sizes.*` filenames are baked from the original upload name and
// would still point at the old object — leaving every consumer broken.
// Exported for direct unit testing.
export const rejectFilenameRename: CollectionBeforeChangeHook = ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (operation !== 'update') return data;
  if (req.file) return data;
  const incoming = (data as { filename?: unknown }).filename;
  const previous = (originalDoc as { filename?: unknown } | undefined)?.filename;
  if (typeof incoming !== 'string' || typeof previous !== 'string') return data;
  if (incoming === previous) return data;
  throw new ValidationError({
    errors: [
      {
        message:
          'Filename rename is not supported after upload. Detach the file and re-upload to change the name.',
        path: 'filename',
      },
    ],
  });
};

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'folder', 'mimeType', 'filesize', 'updatedAt'],
    group: 'Content',
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
    // R2 storage path prefix — set automatically from the folder field on
    // every new upload so files land at {uploadPrefix}/{type}/{filename}.
    // Hidden in admin; managed entirely by the beforeChange hook below.
    {
      name: 'prefix',
      type: 'text',
      admin: { hidden: true },
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
      async ({ data, operation, originalDoc, req }) => {
        const file = req.file;
        if (!file) return data;
        const result = checkUploadSize(file.mimetype, file.size);
        if (!result.ok) {
          throw new ValidationError({
            errors: [{ message: result.reason, path: 'filename' }],
          });
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

        // URL stability: on UPDATE (crop, replace file, focal-point save)
        // we preserve the existing filename. The cloud-storage plugin's
        // afterChange hook would otherwise delete the OLD R2 keys and PUT
        // new ones — but stale Next.js ISR pages, Cloudflare edge cache,
        // and browser cache would still reference the old URL and 404
        // until cache TTLs expire. Keeping the filename stable means the
        // plugin overwrites the same R2 key in place, and every consumer
        // continues to resolve. Editors who want a different filename
        // use the explicit /api/media/:id/rename endpoint which moves
        // R2 keys with proper copy-then-delete semantics.
        if (operation === 'update') {
          const previousFilename =
            typeof (originalDoc as { filename?: unknown } | undefined)?.filename === 'string'
              ? (originalDoc as { filename: string }).filename
              : undefined;
          if (previousFilename) {
            file.name = previousFilename;
            return { ...data, filename: previousFilename };
          }
        }

        // CREATE path: rewrite the upload filename to a canonical,
        // slug-safe form before the s3-storage plugin computes the R2
        // key. The hook must run pre-write because rejectFilenameRename
        // blocks any post-upload rename, and the plugin only PUTs when
        // req.file is present. We mutate req.file.name and data.filename
        // in lockstep so downstream consumers (resize derivatives,
        // media.url, prefix computation) all see the same name.
        const bytes = Buffer.isBuffer(file.data)
          ? file.data
          : Buffer.from(file.data as Uint8Array);
        const incomingAlt =
          typeof (data as { alt?: unknown })?.alt === 'string'
            ? ((data as { alt: string }).alt ?? '').trim()
            : '';
        // Inline-paste / clipboard / data-URI ingest paths supply
        // `image001.png`, `Picture 1`, or `ingested-{ts}` as the
        // file name and alt — useless as a slug. The editor surface
        // (RichPastePlugin, InlineImagePlugin, MediaField) attaches
        // the host doc's slug as a context hint on the `x-media-
        // context-hint` request header so the R2 key carries page
        // provenance: `blog-getting-started-with-sbom-inline-{hash}.webp`
        // instead of `image001-{hash}.webp` × N.
        const contextHint =
          typeof req.headers?.get === 'function'
            ? (req.headers.get('x-media-context-hint') ?? '').trim()
            : '';
        const slugSource = pickSlugSource({
          alt: incomingAlt,
          filename: humaniseFilename(file.name),
          contextHint,
        });
        const ext = canonicalExtensionForMime(file.mimetype);
        const hash = shortHash(bytes);
        const baseFilename = buildMediaFilename({
          slugSource,
          bytes,
          ext,
          hashOverride: hash,
        });

        // Collision check. The short hash in baseFilename means a
        // collision only happens when two uploads share both slug
        // source and short hash but differ in the rest of their
        // bytes — vanishingly rare, but we still iterate `-2`, `-3`
        // … until a free slot is found rather than overwriting.
        const dotIdx = baseFilename.lastIndexOf('.');
        const stem = dotIdx > 0 ? baseFilename.slice(0, dotIdx) : baseFilename;
        const extWithDot = dotIdx > 0 ? baseFilename.slice(dotIdx) : '';
        let candidate = baseFilename;
        // Check the current candidate first; if occupied, advance to stem-N.ext
        // and check that too. The loop ends only after verifying the final
        // candidate, so no slot is assigned without confirmation.
        for (let suffix = 2; ; suffix += 1) {
          const existing = await req.payload.find({
            collection: 'media',
            where: { filename: { equals: candidate } },
            limit: 1,
            depth: 0,
            pagination: false,
          });
          if (existing.docs.length === 0) break;
          if (suffix > 50) break; // hard cap — accept collision in the extremely rare case
          candidate = `${stem}-${suffix}${extWithDot}`;
        }

        file.name = candidate;
        return { ...data, filename: candidate };
      },
    ],
    beforeChange: [
      // Reject filename rename after upload. The s3-storage plugin only writes
      // to R2 when req.file is attached, so a filename-only update would
      // recompute media.url against a key that does not exist in R2 and leave
      // every consumer 404'ing. Editors must detach + re-upload to rename.
      rejectFilenameRename,
      // Compute R2 prefix from folder on new uploads only.
      // Folder values are 'web/{type}'; strip 'web/' and prepend the
      // upload prefix so files land at e.g. dev/blog/filename.webp.
      ({ data, req }) => {
        if (!req.file) return data;
        const folder = data?.folder as string | undefined;
        if (!folder) return data;
        const uploadPrefix =
          process.env.R2_UPLOAD_PREFIX ??
          (process.env.NODE_ENV === 'production' ? 'web' : 'dev');
        const folderType = folder.replace(/^web\//, '');
        return { ...data, prefix: `${uploadPrefix}/${folderType}` };
      },
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
