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
 */
export const WebhookDeadLetter: CollectionConfig = {
  slug: 'webhooks_dead_letter',
  admin: {
    group: 'System',
    defaultColumns: ['event', 'destinationId', 'attemptCount', 'lastError', 'nextRetryAt', 'resolvedAt'],
    useAsTitle: 'webhookId',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  timestamps: true,
  fields: [
    {
      name: 'webhookId',
      type: 'text',
      required: true,
      admin: { description: 'Unique ID for this delivery attempt (UUID).' },
    },
    {
      name: 'event',
      type: 'select',
      required: true,
      options: [
        { label: 'document.published', value: 'document.published' },
        { label: 'lead.submitted', value: 'lead.submitted' },
      ],
    },
    {
      name: 'eventPayload',
      type: 'json',
      required: true,
      admin: { description: 'Full event data blob. Used to re-run the delivery on retry.' },
    },
    {
      name: 'destinationId',
      type: 'text',
      required: true,
      admin: { description: 'teams | generic | <custom id>' },
    },
    {
      name: 'destinationKind',
      type: 'select',
      required: true,
      options: [
        { label: 'Teams', value: 'teams' },
        { label: 'Generic (Standard Webhooks)', value: 'generic' },
      ],
    },
    {
      name: 'destinationLabel',
      type: 'text',
      admin: { description: 'First 80 chars of the destination URL for quick scanning.' },
    },
    {
      name: 'attemptCount',
      type: 'number',
      required: true,
      defaultValue: 1,
      admin: { description: 'How many delivery attempts have been made (including the original).' },
    },
    {
      name: 'lastError',
      type: 'textarea',
      admin: { description: 'Error message or HTTP status from the most recent attempt.' },
    },
    {
      name: 'nextRetryAt',
      type: 'date',
      admin: {
        date: { displayFormat: 'PPpp' },
        description: 'When the retry task will next attempt this delivery. Null = no more retries.',
      },
    },
    {
      name: 'resolvedAt',
      type: 'date',
      admin: {
        date: { displayFormat: 'PPpp' },
        description: 'Set when a retry succeeds. Null = still failing or exhausted.',
      },
    },
    {
      name: 'requestId',
      type: 'text',
      admin: { description: 'x-request-id from the originating HTTP request, for log correlation.' },
    },
  ],
};
