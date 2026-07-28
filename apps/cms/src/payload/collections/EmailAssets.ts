import type { CollectionConfig } from 'payload';
import { ValidationError } from 'payload';

import { isAdmin } from '../access';
import { checkUploadSize } from '../lib/upload-limits';
import { rejectFilenameRename } from './Media';

/**
 * Images embedded in outbound email (signature logo, social icons, campaign
 * banners). Deliberately NOT part of `media`, for two reasons that both break
 * email if ignored:
 *
 *  1. **`media` force-converts every upload to WebP.** Outlook on Windows
 *     renders mail through the Word engine, which does not support WebP (nor
 *     SVG). A signature logo served as WebP shows as a broken-image box in the
 *     single most important client for B2B mail. This collection performs no
 *     format conversion and accepts only PNG/JPEG/GIF.
 *  2. **`media` rewrites filenames to `{slug}-{hash}.{ext}`.** Email assets are
 *     referenced by absolute URL from signatures that live in employees' mail
 *     clients and in every message they have ever sent. Those URLs must stay
 *     stable forever, so the uploaded filename is preserved verbatim.
 *
 * Files land at `{EMAIL_ASSET_PREFIX}/{filename}` on R2 and are served from the
 * public CDN base — i.e. `https://cdn.cleanstart.com/web/emails/logo.png`.
 */

/**
 * R2 key prefix for email assets — `web/emails` in production, `dev/emails`
 * everywhere else, mirroring how `media` namespaces its uploads (`web/blog`,
 * `dev/blog`, …).
 *
 * Deliberately NOT the legacy `emails/assets/` path. The assets the currently
 * installed signatures point at live there, hand-uploaded during the cPanel→R2
 * move, and they are referenced by every message the company has already sent.
 * This collection therefore only ever writes to a fresh prefix: nothing the CMS
 * does can overwrite or delete an object those signatures depend on.
 *
 * Migrating the existing assets onto CMS-managed copies is an editorial choice
 * made later by uploading here and repointing the template — not a side effect
 * of installing this collection.
 */
const resolveEmailAssetPrefix = (): string => {
  // `??` alone would accept an empty string — and `.env.example` ships this key
  // present-and-blank, so a copied env file would resolve the prefix to '' and
  // write objects to the bucket root, which is also where the legacy-path guard
  // stops working.
  const configured = process.env.R2_EMAIL_ASSET_PREFIX?.trim();
  const prefix =
    configured && configured.length > 0
      ? configured
      : process.env.NODE_ENV === 'production'
        ? 'web/emails'
        : 'dev/emails';

  if (/^emails\//.test(prefix) || prefix === 'emails') {
    throw new Error(
      `R2_EMAIL_ASSET_PREFIX="${prefix}" targets the legacy hand-uploaded signature assets. Those objects are referenced by every message already sent and must never be writable from the CMS.`,
    );
  }

  return prefix;
};

export const EMAIL_ASSET_PREFIX: string = resolveEmailAssetPrefix();

/**
 * Formats every major mail client renders. WebP and SVG are excluded on
 * purpose — see the collection docblock.
 */
export const EMAIL_ASSET_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif'] as const;

/**
 * Email clients download assets on every open, often over mobile data, and
 * some providers clip messages past a total size. 300 KB is generous for a
 * signature logo (the optimised CleanStart mark is ~22 KB) while still
 * catching an unoptimised drag-and-drop of a 5 MB export.
 */
const EMAIL_ASSET_SIZE_LIMIT = 300 * 1024;

export const EmailAssets: CollectionConfig = {
  slug: 'emailAssets',
  labels: { singular: 'Email Asset', plural: 'Email Assets' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    group: 'Brand',
    description:
      'Images embedded in outbound email. PNG/JPEG/GIF only — Outlook does not render WebP or SVG. Filenames are permanent: they are referenced from signatures already installed in mail clients.',
  },
  access: {
    read: () => true,
    // Admin-only: replacing a file here changes an image already embedded in
    // every message the company has sent.
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    mimeTypes: [...EMAIL_ASSET_MIME_TYPES],
    // No `formatOptions`, `resizeOptions` or `imageSizes` — the uploaded bytes
    // are stored exactly as provided. Sizing is the uploader's job (see
    // scripts/optimise-email-asset.ts), because an email asset must be
    // pre-sized to its retina display width rather than resized per request.
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Shown when the recipient blocks images — which most clients do by default. Describe the image, e.g. "CleanStart logo".',
      },
    },
    {
      name: 'usage',
      type: 'text',
      admin: {
        description: 'Where this asset is used, e.g. "Signature logo (rendered at 140px wide)".',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const file = req.file;
        if (!file) return data;

        const sized = checkUploadSize(file.mimetype, file.size);
        if (!sized.ok) {
          throw new ValidationError({ errors: [{ message: sized.reason, path: 'filename' }] });
        }

        if (file.size > EMAIL_ASSET_SIZE_LIMIT) {
          throw new ValidationError({
            errors: [
              {
                message: `Email assets must be under ${Math.round(
                  EMAIL_ASSET_SIZE_LIMIT / 1024,
                )} KB — this file is ${Math.round(
                  file.size / 1024,
                )} KB. Optimise it first (target 2× its rendered width).`,
                path: 'filename',
              },
            ],
          });
        }

        if (
          !(EMAIL_ASSET_MIME_TYPES as readonly string[]).includes(file.mimetype)
        ) {
          throw new ValidationError({
            errors: [
              {
                message: `${file.mimetype} does not render in Outlook. Use PNG, JPEG or GIF.`,
                path: 'filename',
              },
            ],
          });
        }

        return data;
      },
    ],
    // Same rationale as `media`: the storage plugin only writes to R2 when a
    // file is attached, so a filename-only update would repoint the doc at a
    // key that does not exist. Here it matters more — the old URL is embedded
    // in already-sent mail and would start 404ing.
    beforeChange: [rejectFilenameRename],
  },
  timestamps: true,
};
