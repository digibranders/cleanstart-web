import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access';

/**
 * Append-only audit trail for sensitive actions (lead deletions, CSV
 * exports, DSAR exports, DSAR erasures). Required for GDPR Art. 15
 * defensibility — without this, lead deletions leave no evidence of
 * who did what when. Writes happen via internal hooks with
 * `overrideAccess: true`; the public API is admin read-only.
 *
 * Adding actions: extend the `action` select. Don't widen the schema
 * fields — per-action payload goes into `metadata` JSON.
 */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Audit log entry', plural: 'Audit log' },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['timestamp', 'action', 'targetCollection', 'targetId', 'actorUserId'],
    group: 'System',
    description:
      'Append-only record of sensitive actions on leads + DSAR events. Read-only — entries are written by hooks, never via the admin UI.',
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Lead deleted', value: 'lead_deleted' },
        { label: 'Lead exported', value: 'lead_exported' },
        { label: 'DSAR export', value: 'dsar_export' },
        { label: 'DSAR erasure', value: 'dsar_erasure' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'targetCollection',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'targetId',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'actorUserId',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Admin who performed the action. Null for system / cron writes.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'requestIp',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'acceptLanguage',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'proxyChainLength',
      type: 'number',
      admin: {
        description: 'Number of hops parsed from X-Forwarded-For at request time.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Per-action payload (e.g. row count for exports, deleted lead snapshot).',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
