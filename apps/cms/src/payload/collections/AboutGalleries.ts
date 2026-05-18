import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { mediaUploadField } from '../fields/media-upload';
import { slugify } from '../lib/slugify';
import { normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

export const AboutGalleries: CollectionConfig = {
  slug: 'aboutGalleries',
  labels: { singular: 'About gallery item', plural: 'About galleries' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'displayOrder', '_status', 'updatedAt'],
    description:
      'Image rows shown on /about-us. Each item is NOT URL-addressable — only /about-us reads this collection.',
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  defaultSort: 'displayOrder',
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Internal-only slug. Not URL-addressable.',
        position: 'sidebar',
        hidden: true,
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (typeof value === 'string' && value.trim().length > 0) return slugify(value);
            const fallback = (data as Record<string, unknown> | undefined)?.name;
            return typeof fallback === 'string' ? slugify(fallback) : value;
          },
        ],
      },
    },
    mediaUploadField({ name: 'image', required: true, folderHint: 'web/about' }),
    { name: 'caption', type: 'text' },
    {
      name: 'imageLink',
      type: 'text',
      admin: {
        description:
          'Optional click-destination for the gallery image. Site-relative path (/about-us#team) or full URL. Empty = the image is non-interactive.',
      },
      hooks: { beforeValidate: [normalizeOptionalUrlHook] },
      validate: validateOptionalUrl,
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Drag to reorder in the list view (Phase D admin UX).',
        position: 'sidebar',
      },
    },
  ],
  versions: { drafts: true },
  timestamps: true,
};
