import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { isValidExternalLink } from '../lib/url-shape';

const SOURCE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Manual', value: 'manual' },
  { label: 'Slug change', value: 'slug-change' },
  { label: 'Archive with redirect', value: 'archive-with-redirect' },
  { label: 'Migration seed', value: 'migration-seed' },
];

const isSystemManaged = (source: unknown): boolean => source === 'slug-change';

const validatePath = (value: unknown): true | string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'Path is required.';
  }
  // Accept site-relative paths or full external URLs (mailto/tel/path/url
  // shapes from the link helper). Catches free-text typos like 'foo' (no
  // leading slash) and protocol-relative '//evil.com' URLs.
  if (!isValidExternalLink(value)) {
    return 'Must be a site-relative path (/path) or a full https?:// URL.';
  }
  return true;
};

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Redirect', plural: 'Redirects' },
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'status', 'source', 'hitCount', 'lastHitAt'],
    group: 'System',
  },
  // Read is public so apps/web's middleware (and future render workers) can
  // consume the table without a session. Writes remain editor+ only.
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Source path (e.g. /old-pricing). System-managed rules (source=slug-change) are locked from manual edit.',
      },
      access: {
        update: ({ data, doc }) =>
          !isSystemManaged((doc as { source?: string } | undefined)?.source ?? data?.source),
      },
      validate: validatePath,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: '301',
      options: [
        { label: '301 Moved Permanently', value: '301' },
        { label: '302 Found', value: '302' },
        { label: '307 Temporary Redirect', value: '307' },
        { label: '308 Permanent Redirect', value: '308' },
        { label: '410 Gone', value: '410' },
      ],
      access: {
        update: ({ data, doc }) =>
          !isSystemManaged((doc as { source?: string } | undefined)?.source ?? data?.source),
      },
    },
    {
      name: 'to',
      type: 'text',
      admin: {
        description:
          'Destination path or absolute URL. Required unless status=410. System-managed rules are locked.',
        condition: (_data, sibling) => sibling?.status !== '410',
      },
      access: {
        update: ({ data, doc }) =>
          !isSystemManaged((doc as { source?: string } | undefined)?.source ?? data?.source),
      },
      validate: (
        value: string | string[] | null | undefined,
        { siblingData }: { siblingData?: { status?: string; from?: string } },
      ): true | string => {
        if (siblingData?.status === '410') return true;
        const pathOk = validatePath(value);
        if (pathOk !== true) return pathOk;
        if (typeof value === 'string' && value === siblingData?.from) {
          return 'Destination cannot be the same as the source.';
        }
        return true;
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: SOURCE_OPTIONS,
      access: { update: () => false },
      admin: {
        description: 'Provenance. System-set on creation; never manually edited.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Why this redirect exists. Future editors thank you.',
      },
    },
    {
      name: 'hitCount',
      type: 'number',
      defaultValue: 0,
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Incremented in apps/web middleware on every match.',
        position: 'sidebar',
      },
    },
    {
      name: 'lastHitAt',
      type: 'date',
      access: { update: () => false },
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
};
