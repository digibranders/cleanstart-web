import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';

import { isAdmin } from '../access';
import { encryptJson, isEncrypted } from '../lib/integrations/secrets';

/**
 * Editor-facing surface for the integrations dashboard (Phase J1).
 *
 * One row = one destination. Multiple Teams rows for multiple
 * channels, multiple generic-webhook rows for multiple subscribers.
 * Routing is per-row — each row decides which events it cares about.
 *
 * Schema decisions (locked in plan §J1):
 *   - `kind` is locked after creation; changing kind = delete + recreate.
 *   - `config` is an encrypted blob (AES-256-GCM, key derived from
 *     PAYLOAD_SECRET). Plaintext never lands in Postgres. The admin
 *     form sees a JSON shape; the beforeChange hook encrypts on write,
 *     and the dispatcher decrypts at read time.
 *   - `source` distinguishes DB-backed rows from env-driven legacy
 *     rows. Env rows are synthesised on read (not stored) — but the
 *     field exists so the list view can render the "Legacy (env)" badge.
 *   - `lastHealthAt` is updated by the HealthBadge component when it
 *     polls webhooks_dead_letter; not authoritative state, just cache.
 *   - `minLeadScore` is intentionally absent — lands with the first
 *     scoring rule (per plan Q4).
 */

const J1_KIND_OPTIONS = [
  { label: 'Microsoft Teams (Workflow webhook)', value: 'teamsWorkflow' },
  { label: 'Generic webhook (Standard Webhooks)', value: 'genericWebhook' },
] as const;

const RESERVED_KIND_OPTIONS = [
  { label: 'Zoho CRM (J3)', value: 'zohoCrm' },
  { label: 'GA4 Data API (J2)', value: 'ga4DataApi' },
  { label: 'GSC Search Analytics (J2)', value: 'gscSearchAnalyticsApi' },
  { label: 'GSC URL Inspection (J2)', value: 'gscUrlInspectionApi' },
  { label: 'MS Clarity (J2)', value: 'msClarity' },
  { label: 'Cloudflare Web Analytics (J2)', value: 'cloudflareWebAnalytics' },
  { label: 'Cal.com inbound (J4)', value: 'calComInbound' },
  { label: 'Brevo bounce callback (J4)', value: 'brevoBounceCallback' },
] as const;

const ALL_KIND_VALUES = [
  ...J1_KIND_OPTIONS.map((o) => o.value),
  ...RESERVED_KIND_OPTIONS.map((o) => o.value),
] as const;

export type IntegrationKind = (typeof ALL_KIND_VALUES)[number];

const J1_KIND_SET = new Set<IntegrationKind>(J1_KIND_OPTIONS.map((o) => o.value));

/** Lock `kind` after the row is created — only validate on create. */
const encryptConfigBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  // Lock `kind` after create.
  if (operation === 'update' && originalDoc && data.kind && data.kind !== originalDoc.kind) {
    throw new Error(
      `integrations.kind is immutable after creation (was "${originalDoc.kind}", attempted "${data.kind}")`,
    );
  }

  // Block kinds reserved for later phases on create.
  if (operation === 'create' && data.kind && !J1_KIND_SET.has(data.kind as IntegrationKind)) {
    throw new Error(
      `integrations.kind "${data.kind}" is reserved for a later phase and cannot be created yet`,
    );
  }

  // Encrypt the config blob. The admin form posts an object; we
  // serialise + AES-256-GCM encrypt it before it hits the DB. If the
  // value is already a v1:-prefixed string (e.g. an unchanged update),
  // pass through untouched.
  if (data.config != null && !isEncrypted(data.config)) {
    data.config = encryptJson(data.config);
  }

  return data;
};

export const Integrations: CollectionConfig = {
  slug: 'integrations',
  labels: { singular: 'Integration', plural: 'Integrations' },
  admin: {
    group: 'System',
    useAsTitle: 'label',
    defaultColumns: ['label', 'kind', 'enabled', 'source', 'updatedAt'],
    description:
      'Outbound channels and analytics read-back wired without a code change. Encrypted secrets, per-row routing.',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  timestamps: true,
  hooks: {
    beforeChange: [encryptConfigBeforeChange],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'Human-readable name, e.g. "Sales channel · #sales-eng-leads".',
      },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [...J1_KIND_OPTIONS, ...RESERVED_KIND_OPTIONS],
      admin: {
        description:
          'Integration type. Locked after creation — changing kind means delete + recreate.',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Pause without deleting. Disabled rows are skipped by the dispatcher.',
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'db',
      options: [
        { label: 'Database', value: 'db' },
        { label: 'Legacy (env)', value: 'env' },
      ],
      admin: {
        readOnly: true,
        description:
          'How this row is configured. Env rows are synthesised from process.env for read-only display; new rows are always "db".',
      },
    },
    {
      name: 'routing',
      type: 'group',
      fields: [
        {
          name: 'events',
          type: 'select',
          hasMany: true,
          required: true,
          options: [
            { label: 'document.published', value: 'document.published' },
            { label: 'lead.submitted', value: 'lead.submitted' },
          ],
          admin: {
            description: 'Which events trigger a delivery to this row.',
          },
        },
        {
          name: 'collections',
          type: 'text',
          hasMany: true,
          admin: {
            description:
              'Filter document.published by collection slug. Empty = all collections.',
          },
        },
        {
          name: 'formSlugs',
          type: 'text',
          hasMany: true,
          admin: {
            description:
              'Filter lead.submitted by form slug. Empty = all forms.',
          },
        },
      ],
    },
    {
      name: 'config',
      type: 'json',
      required: true,
      admin: {
        description:
          'Per-kind config (webhook URL, signing secret, OAuth tokens, etc.). Encrypted at rest with PAYLOAD_SECRET-derived AES-256-GCM. Never returned in plaintext after save.',
      },
    },
    {
      name: 'lastHealthAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: { displayFormat: 'PPpp' },
        description: 'Last time the health badge re-queried webhooks_dead_letter for this row.',
      },
    },
    {
      name: 'healthBadge',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/integrations/HealthBadge.tsx#HealthBadge',
          },
        },
      },
    },
    {
      name: 'testAction',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/integrations/TestButton.tsx#TestButton',
          },
        },
      },
    },
    {
      name: 'auditTrail',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/integrations/AuditTrail.tsx#AuditTrail',
          },
        },
      },
    },
  ],
};

export { J1_KIND_OPTIONS, RESERVED_KIND_OPTIONS };
