import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';
import { exportLeadsCsvEndpoint } from '../endpoints/export-leads-csv';
import { submitLeadEndpoint, submitLeadOptionsEndpoint } from '../endpoints/submit-lead';
import { extractRequestMeta } from '../lib/request-meta';

const SYNC_STATUSES: { label: string; value: string }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Synced', value: 'synced' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped (duplicate)', value: 'skipped' },
];

/**
 * Writes an audit-log row when a lead is deleted. GDPR Art. 15 needs
 * the trail to defend against "did you actually erase the record?"
 * subject requests. Audit failures are isolated — they log but never
 * block the parent delete, otherwise a broken audit-log collection
 * would lock admins out of legitimate erasures.
 */
const writeLeadDeletionAudit: CollectionAfterDeleteHook = async ({ req, doc, id }) => {
  try {
    const meta = extractRequestMeta(req.headers);
    const rawActorId = req.user
      ? (req.user as { id?: string | number }).id ?? null
      : null;
    const actorId =
      typeof rawActorId === 'number'
        ? rawActorId
        : typeof rawActorId === 'string'
          ? Number.parseInt(rawActorId, 10)
          : null;
    const actorUserId =
      typeof actorId === 'number' && Number.isFinite(actorId) ? actorId : null;
    await req.payload.create({
      collection: 'audit-log',
      data: {
        timestamp: new Date().toISOString(),
        action: 'lead_deleted',
        targetCollection: 'leads',
        targetId: String(id),
        actorUserId,
        requestIp: meta.ip,
        userAgent: meta.userAgent ?? null,
        acceptLanguage: meta.acceptLanguage ?? null,
        proxyChainLength: meta.proxyChainLength,
        metadata: {
          formId:
            typeof (doc as { form?: unknown }).form === 'number'
              ? (doc as { form: number }).form
              : null,
          createdAt: (doc as { createdAt?: string }).createdAt ?? null,
        },
      },
      overrideAccess: true,
    });
  } catch (error) {
    req.payload.logger.error(
      {
        err: error instanceof Error ? error.message : String(error),
        leadId: id,
      },
      'Failed to write audit-log row for lead deletion',
    );
  }
};

/**
 * Append-only submission record. Every form submission lands here via the
 * LeadHandler adapter chain (db primary + Brevo / Teams / R2-fallback
 * secondaries). Editor-facing fields are limited to filterable metadata;
 * the actual answers live as JSON in `fields`.
 *
 * PII fields (email-typed keys + phone-named keys inside `fields`,
 * plus `ip`, `userAgent`) are auto-purged after retentionDays via
 * the lead-purge cron (Phase G); the row sets `piiRedactedAt` once
 * scrubbed. Sentry / structured-log redaction is applied separately
 * so the raw values never reach an external sink.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Lead', plural: 'Leads' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['form', 'source', 'syncedTo', 'createdAt'],
    group: 'Marketing',
    description:
      'Form submissions (append-only). Editing is disabled — leads are immutable once captured. Use the CSV export for bulk handoff.',
    // Append-only contract: manual creation in the admin UI would
    // bypass the LeadHandler adapter (R2 fallback queue + CRM dispatch
    // + dedup). The "Create New" header pill and empty-state CTA are
    // hidden via CSS targeted at `body.collection-leads` — see
    // _list-controls.scss. API-level `access.create` stays admin-only
    // for emergency tooling.
    components: {
      beforeListTable: [
        '@/payload/admin/components/LeadsImmutableBanner.tsx#LeadsImmutableBanner',
        '@/payload/admin/components/LeadsCsvTruncationBanner.tsx#LeadsCsvTruncationBanner',
        '@/payload/admin/components/DsarActionsPanel.tsx#DsarActionsPanel',
        '@/payload/admin/components/FlaggedLeadsTab.tsx#FlaggedLeadsTab',
      ],
    },
  },
  access: {
    read: isAdminOrEditor,
    // Public form posts go through the /api/leads/submit custom endpoint,
    // which uses overrideAccess server-side. Direct REST POSTs to /api/leads
    // are admin-only — closes the spam-via-CRUD vector.
    create: isAdmin,
    update: () => false, // Append-only.
    delete: isAdmin,
  },
  endpoints: [submitLeadEndpoint, submitLeadOptionsEndpoint, exportLeadsCsvEndpoint],
  hooks: {
    afterDelete: [writeLeadDeletionAudit],
  },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: { description: 'Form the visitor submitted.' },
    },
    {
      name: 'formSchemaVersion',
      type: 'number',
      required: true,
      admin: {
        description:
          "Captured at submit time — preserves this record's field key meaning even after the form's fields[] is renamed.",
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'fields',
      type: 'json',
      required: true,
      admin: {
        description: 'Visitor answers as a JSON map of {fieldName: value}.',
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'URL of the page the form was submitted from (referrer).',
        position: 'sidebar',
      },
    },
    {
      type: 'group',
      name: 'utm',
      label: 'UTM',
      admin: { description: 'From the query string at submit time.', position: 'sidebar' },
      fields: [
        { name: 'campaign', type: 'text' },
        { name: 'source', type: 'text' },
        { name: 'medium', type: 'text' },
        { name: 'term', type: 'text' },
        { name: 'content', type: 'text' },
      ],
    },
    {
      name: 'ip',
      type: 'text',
      admin: {
        description: 'Auto-purged after retention window. Never logged in raw form.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'Auto-purged after retention window.',
        readOnly: true,
      },
    },
    {
      name: 'consentGivenAt',
      type: 'date',
      admin: {
        description: 'Timestamp of the GDPR consent checkbox tick (when present).',
        date: { pickerAppearance: 'dayAndTime' },
        readOnly: true,
      },
    },
    {
      name: 'consentSnapshot',
      type: 'textarea',
      admin: {
        description:
          'Exact consent text the visitor saw. Snapshotted from forms.fields[].consentText so it survives policy edits — required for GDPR audit defensibility.',
        readOnly: true,
      },
    },
    {
      name: 'privacyPolicyVersion',
      type: 'text',
      admin: {
        description:
          'siteSettings legal.policyVersion at submit time. Pairs with consentSnapshot for the full audit chain.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'consentCategories',
      type: 'array',
      admin: {
        description: 'Cookie-consent categories the visitor selected (empty until a CMP ships).',
        readOnly: true,
      },
      fields: [{ name: 'category', type: 'text' }],
    },
    {
      name: 'syncedTo',
      type: 'array',
      labels: { singular: 'Sync', plural: 'Sync attempts' },
      admin: {
        description:
          'One row per secondary handler (HubSpot, company-from-domain). Failed rows are retryable.',
        readOnly: true,
      },
      fields: [
        { name: 'handler', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: SYNC_STATUSES,
        },
        {
          name: 'syncedAt',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        { name: 'externalId', type: 'text' },
        { name: 'error', type: 'text' },
      ],
    },
    {
      name: 'enriched',
      type: 'json',
      admin: {
        description:
          'Map of {handler: enrichmentResult}. Free company-from-domain handler runs at launch; external (Clearbit/ZoomInfo) deferred.',
        readOnly: true,
      },
    },
    {
      name: 'duplicateOf',
      type: 'relationship',
      relationTo: 'leads',
      admin: {
        description:
          'Set when a same-email same-form submission lands within 24h of the original. The duplicate row is kept for audit; CRM secondaries skip the resync.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'piiRedactedAt',
      type: 'date',
      access: { update: () => false },
      admin: {
        description:
          'Stamped by the daily PII purge once ip / userAgent / email / phone fields have been nulled. Used as the idempotency marker so re-runs skip already-redacted rows.',
        readOnly: true,
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'honeypot',
      type: 'text',
      admin: {
        description:
          'Non-empty when the hidden honeypot field was filled at submit time. Indicates likely bot submission.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'turnstilePassed',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'False when the Cloudflare Turnstile challenge was not passed at submit time.',
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
};
