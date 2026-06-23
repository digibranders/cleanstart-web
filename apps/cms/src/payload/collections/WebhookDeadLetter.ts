import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access';

/**
 * Stores webhook deliveries that failed all retry attempts (or are
 * pending retry). Each row represents one delivery attempt to one
 * destination for one event.
 *
 * Lifecycle:
 *   1. dispatchEvent writes a row when the first delivery fails.
 *   2. retryWebhookTask checks rows where nextRetryAt <= now and
 *      resolvedAt IS NULL, retries, and either marks resolved or bumps
 *      the retry schedule.
 *   3. After 5 failed attempts the row stays in this table indefinitely
 *      so an admin can review it.
 *
 * Admin can hard-delete rows once they've been triaged. Soft-delete is
 * intentionally disabled — no need for a recycle bin on delivery logs.
 *
 * System-managed log: every row is written by dispatchEvent (create) and
 * mutated by retryWebhookTask (update) via `overrideAccess: true`, which
 * bypasses the access rules below. Create/update are therefore hard-denied
 * so the admin can't hand-edit a row — editing `eventPayload` would corrupt
 * the blob the retry task re-sends, and editing the schedule/state fields
 * breaks the retry invariants. Every field is also `admin.readOnly` because
 * collection-level `update: () => false` blocks the save but does NOT disable
 * the form inputs. Read + delete stay admin-gated for triage.
 */
export const WebhookDeadLetter: CollectionConfig = {
  slug: 'webhooks_dead_letter',
  labels: { singular: 'Webhook dead letter', plural: 'Webhook dead letters' },
  admin: {
    group: 'System',
    defaultColumns: ['event', 'destinationId', 'attemptCount', 'lastError', 'nextRetryAt', 'resolvedAt'],
    useAsTitle: 'webhookId',
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  timestamps: true,
  fields: [
    {
      name: 'webhookId',
      type: 'text',
      required: true,
      admin: { readOnly: true, description: 'Unique ID for this delivery attempt (UUID).' },
    },
    {
      name: 'event',
      type: 'select',
      required: true,
      admin: { readOnly: true },
      options: [
        { label: 'document.published', value: 'document.published' },
        { label: 'lead.submitted', value: 'lead.submitted' },
      ],
    },
    {
      name: 'eventPayload',
      type: 'json',
      required: true,
      admin: { readOnly: true, description: 'Full event data blob. Used to re-run the delivery on retry.' },
    },
    {
      name: 'destinationId',
      type: 'text',
      required: true,
      admin: { readOnly: true, description: 'teams | generic | <custom id>' },
    },
    {
      name: 'destinationKind',
      type: 'select',
      required: true,
      admin: { readOnly: true },
      options: [
        { label: 'Teams', value: 'teams' },
        { label: 'Generic (Standard Webhooks)', value: 'generic' },
      ],
    },
    {
      name: 'destinationLabel',
      type: 'text',
      admin: { readOnly: true, description: 'First 80 chars of the destination URL for quick scanning.' },
    },
    {
      name: 'attemptCount',
      type: 'number',
      required: true,
      defaultValue: 1,
      admin: { readOnly: true, description: 'How many delivery attempts have been made (including the original).' },
    },
    {
      name: 'lastError',
      type: 'textarea',
      admin: { readOnly: true, description: 'Error message or HTTP status from the most recent attempt.' },
    },
    {
      name: 'nextRetryAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: { displayFormat: 'PPpp' },
        description: 'When the retry task will next attempt this delivery. Null = no more retries.',
      },
    },
    {
      name: 'resolvedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: { displayFormat: 'PPpp' },
        description: 'Set when a retry succeeds. Null = still failing or exhausted.',
      },
    },
    {
      name: 'requestId',
      type: 'text',
      admin: { readOnly: true, description: 'x-request-id from the originating HTTP request, for log correlation.' },
    },
  ],
};
