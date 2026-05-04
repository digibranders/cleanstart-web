import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';

const SOURCE_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Slug change', value: 'slug-change' },
  { label: 'Archive with redirect', value: 'archive-with-redirect' },
  { label: 'Migration seed', value: 'migration-seed' },
] as const;

const isSystemManaged = (source: unknown): boolean => source === 'slug-change';

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Redirect', plural: 'Redirects' },
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'status', 'source', 'hitCount', 'lastHitAt'],
    group: 'System',
  },
  access: {
    read: isAdminOrEditor,
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
        description: 'Source path (e.g. /old-pricing). Read-only for system-managed redirects.',
      },
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
    },
    {
      name: 'to',
      type: 'text',
      admin: {
        description:
          'Destination path or absolute URL. Required unless status=410. Read-only for slug-change rules.',
        condition: (_data, sibling) => sibling?.status !== '410',
      },
      validate: (
        value: string | string[] | null | undefined,
        { siblingData }: { siblingData?: { status?: string } },
      ): true | string => {
        if (siblingData?.status === '410') return true;
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Destination is required unless status is 410.';
        }
        return true;
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: SOURCE_OPTIONS as unknown as { label: string; value: string }[],
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
        description: 'Incremented in apps/web middleware on every match (Phase E).',
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
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (!data) return data;
        const source = data.source ?? originalDoc?.source;
        if (isSystemManaged(source)) {
          return data;
        }
        return data;
      },
    ],
  },
  timestamps: true,
};
