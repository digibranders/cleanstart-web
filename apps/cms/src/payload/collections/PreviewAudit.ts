import type { CollectionConfig } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';

/**
 * Audit row per minted preview-share token. Rows are written by
 * `/api/preview/token` and looked up on every `/api/preview/verify`
 * call so an editor can revoke an in-the-wild link via the
 * `/admin/preview-links` view (sets `revokedAt`).
 *
 * The `purgePreviewAudit` job (daily 03:30 UTC) deletes rows whose
 * `expiresAt` is older than 90 days, per arch doc retention rules.
 * No PII beyond actor + label is stored — payload is reconstructable
 * from the JWT and the audit row id alone.
 */
export const PreviewAudit: CollectionConfig = {
  slug: 'previewAudit',
  labels: { singular: 'Preview link', plural: 'Preview links' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['collection', 'docId', 'actor', 'expiresAt', 'revokedAt', 'createdAt'],
    group: 'System',
    description:
      'Active and revoked preview-share links. Revoke a row to invalidate the link immediately.',
  },
  access: {
    read: isAdminOrEditor,
    // Endpoint mints rows with overrideAccess; direct admin create is
    // disallowed to keep the only entry path through the JWT signer.
    create: () => false,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'collection',
      type: 'text',
      required: true,
      admin: { description: 'Payload collection slug the token targets.' },
    },
    {
      name: 'docId',
      type: 'text',
      required: true,
      admin: { description: 'Doc id within the collection.' },
    },
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { description: 'Editor who minted the link.' },
    },
    {
      name: 'label',
      type: 'text',
      admin: { description: 'Optional human label, e.g. "Legal review – Q2 launch post".' },
    },
    {
      name: 'ttlSeconds',
      type: 'number',
      required: true,
      admin: { readOnly: true, description: 'TTL chosen at mint time.' },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'revokedAt',
      type: 'date',
      admin: {
        description: 'Set this (or click Revoke in the row actions) to invalidate the link.',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
  timestamps: true,
};
