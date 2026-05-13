import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
} from 'payload';

import { isAdmin } from '../access';
import { encrypt, isEncrypted } from '../lib/integrations/secrets';

/**
 * Editor-facing surface for the integrations dashboard.
 *
 * Design intent (per user feedback 2026-05-12): no raw JSON config.
 * Each kind exposes a small set of friendly fields. Secret tokens
 * (HubSpot, GA4 service account, Clarity, Cloudflare, Cal.com, Brevo)
 * are NOT in the row at all — they live in env vars set by ops via
 * Coolify, and the handler reads them at run time via
 * `lib/integrations/credentials.ts`. The admin row only carries the
 * non-secret destination details (Teams URL, GA4 property ID, GSC
 * site URL, etc.).
 *
 * Per-row secrets that ARE in scope (Teams Workflow URL, generic
 * webhook signing secret) are AES-256-GCM-encrypted via the
 * beforeChange hook. They round-trip plaintext in the admin UI for
 * editing convenience but never land in Postgres as plaintext.
 *
 * Schema decisions:
 *   - `kind` is locked after creation.
 *   - The wrap fields (`source`, `lastHealthAt`) are read-only.
 *   - Per-kind groups are conditional — only the active kind's group
 *     renders. Other groups stay null in the DB.
 *   - `routing` shows only for kinds that subscribe to outbound events
 *     (teamsWorkflow, genericWebhook, hubspotCrm).
 */

const ACTIVE_KIND_OPTIONS = [
  { label: 'Microsoft Teams (Workflow webhook)', value: 'teamsWorkflow' },
  { label: 'Generic webhook (Standard Webhooks)', value: 'genericWebhook' },
  { label: 'HubSpot CRM (primary CRM)', value: 'hubspotCrm' },
  { label: 'Google Analytics 4 (GA4 Data API)', value: 'ga4DataApi' },
  { label: 'Google Search Console — Search Analytics', value: 'gscSearchAnalyticsApi' },
  { label: 'Google Search Console — URL Inspection', value: 'gscUrlInspectionApi' },
  { label: 'Microsoft Clarity', value: 'msClarity' },
  { label: 'Cloudflare Web Analytics', value: 'cloudflareWebAnalytics' },
  { label: 'Cal.com inbound (booking → lead)', value: 'calComInbound' },
  { label: 'Brevo bounce / complaint callback', value: 'brevoBounceCallback' },
] as const;

const RESERVED_KIND_OPTIONS = [
  { label: 'Zoho CRM (deferred)', value: 'zohoCrm' },
] as const;

const ALL_KIND_VALUES = [
  ...ACTIVE_KIND_OPTIONS.map((o) => o.value),
  ...RESERVED_KIND_OPTIONS.map((o) => o.value),
] as const;

export type IntegrationKind = (typeof ALL_KIND_VALUES)[number];

const ACTIVE_KIND_SET = new Set<IntegrationKind>(ACTIVE_KIND_OPTIONS.map((o) => o.value));

// Which kinds subscribe to outbound events (and therefore need routing).
const DISPATCHING_KINDS = new Set<IntegrationKind>([
  'teamsWorkflow',
  'genericWebhook',
  'hubspotCrm',
]);

// Per-kind paths whose value should be encrypted at rest. The
// beforeChange hook scans these paths and encrypts any plaintext
// value it finds.
const SECRET_PATHS: Record<string, ReadonlyArray<readonly [string, string]>> = {
  teamsWorkflow: [['teamsConfig', 'webhookUrl']],
  genericWebhook: [
    ['genericConfig', 'url'],
    ['genericConfig', 'signingSecret'],
  ],
};

const isDispatching = (sibling: unknown): boolean => {
  const kind = (sibling as { kind?: string } | null)?.kind;
  return typeof kind === 'string' && DISPATCHING_KINDS.has(kind as IntegrationKind);
};

const kindIs =
  (target: IntegrationKind | readonly IntegrationKind[]) =>
  (_: unknown, sibling: unknown): boolean => {
    const kind = (sibling as { kind?: string } | null)?.kind;
    if (!kind) return false;
    if (Array.isArray(target)) return (target as readonly string[]).includes(kind);
    return kind === target;
  };

// ─── beforeChange + afterRead ────────────────────────────────────

const encryptSecretsBeforeChange: CollectionBeforeChangeHook = async ({
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

  // Block reserved kinds on create.
  if (operation === 'create' && data.kind && !ACTIVE_KIND_SET.has(data.kind as IntegrationKind)) {
    throw new Error(
      `integrations.kind "${data.kind}" is reserved and cannot be created yet`,
    );
  }

  // Encrypt any plaintext secret on a known path. Values that are
  // already encrypted (v1: prefix) pass through. Blank values that
  // had a prior encrypted value get restored from originalDoc — this
  // lets the admin leave the field empty to mean "keep the saved one".
  const paths = SECRET_PATHS[data.kind as string] ?? [];
  for (const path of paths) {
    const [group, field] = path;
    const groupData = (data as Record<string, Record<string, unknown> | null>)[group];
    if (!groupData) continue;
    const value = groupData[field];
    if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
      groupData[field] = encrypt(value);
    } else if (value === '' || value == null) {
      // Empty → restore prior encrypted value, if any, so editor can
      // leave secret fields blank to keep them unchanged.
      const prior = (originalDoc as Record<string, Record<string, unknown> | null> | null)?.[
        group
      ]?.[field];
      if (typeof prior === 'string' && isEncrypted(prior)) {
        groupData[field] = prior;
      }
    }
  }

  return data;
};

const maskSecretsAfterRead: CollectionAfterReadHook = async ({ doc }) => {
  const paths = SECRET_PATHS[doc.kind as string] ?? [];
  // Show encrypted secrets as a sentinel so the editor knows a secret
  // is set, without exposing the ciphertext blob in the form. The
  // beforeChange handler restores the prior value if the editor saves
  // without changing it.
  const masked: Record<string, unknown> = { ...doc };
  for (const path of paths) {
    const [group, field] = path;
    const groupData = masked[group] as Record<string, unknown> | null | undefined;
    if (!groupData) continue;
    const value = groupData[field];
    if (typeof value === 'string' && isEncrypted(value)) {
      masked[group] = { ...groupData, [field]: '••••••• (saved — paste a new value to replace)' };
    }
  }
  return masked;
};

// ─── Per-kind groups ─────────────────────────────────────────────

const teamsConfigGroup: Field = {
  name: 'teamsConfig',
  type: 'group',
  label: 'Microsoft Teams settings',
  admin: {
    condition: kindIs('teamsWorkflow'),
    description:
      'One row = one Teams channel. Get the URL from the Workflows app in Teams (template: "Post to a channel when a webhook request is received").',
  },
  fields: [
    {
      name: 'webhookUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'Workflow webhook URL. Encrypted at rest. Leave blank when editing to keep the saved value.',
        placeholder: 'https://prod-XX.westus.logic.azure.com/workflows/...',
      },
    },
    {
      name: 'mentions',
      type: 'array',
      labels: { singular: 'mention', plural: 'mentions' },
      admin: {
        description:
          'Optional — paste each person\'s AAD Object ID + UPN from the Entra portal to ping them with @-mentions.',
      },
      fields: [
        { name: 'displayName', type: 'text', required: true, admin: { placeholder: 'Alex' } },
        {
          name: 'aadObjectId',
          type: 'text',
          required: true,
          admin: { placeholder: '00000000-0000-0000-0000-000000000000' },
        },
        {
          name: 'upn',
          type: 'text',
          required: true,
          admin: { placeholder: 'alex@cleanstart.com' },
        },
        {
          name: 'triggerOn',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'document.published', value: 'document.published' },
            { label: 'lead.submitted', value: 'lead.submitted' },
          ],
          admin: {
            description: 'Optional — restrict this mention to specific events. Empty = all.',
          },
        },
      ],
    },
  ],
};

const genericConfigGroup: Field = {
  name: 'genericConfig',
  type: 'group',
  label: 'Generic webhook settings',
  admin: {
    condition: kindIs('genericWebhook'),
    description:
      'Posts a signed JSON payload (Standard Webhooks) to an external URL. Use this for Zapier / n8n / Make / custom receivers.',
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'Subscriber URL. Encrypted at rest.',
        placeholder: 'https://hooks.zapier.com/...',
      },
    },
    {
      name: 'signingSecret',
      type: 'text',
      required: true,
      admin: {
        description:
          'HMAC-SHA256 shared secret. Encrypted at rest. Leave blank when editing to keep the saved value.',
      },
    },
    {
      name: 'signingKeyId',
      type: 'text',
      admin: {
        description: 'Optional key ID surfaced in audit logs and used during rotation.',
      },
    },
  ],
};

const hubspotConfigGroup: Field = {
  name: 'hubspotConfig',
  type: 'group',
  label: 'HubSpot CRM settings',
  admin: {
    condition: kindIs('hubspotCrm'),
    description:
      'Access token comes from the HUBSPOT_PRIVATE_APP_TOKEN env var — nothing to paste here. This row only carries optional mapping overrides.',
  },
  fields: [
    {
      name: 'writeMode',
      type: 'select',
      defaultValue: 'contactOnly',
      options: [
        { label: 'Contact only (recommended)', value: 'contactOnly' },
        { label: 'Contact + Lead (use HubSpot Leads object)', value: 'contactAndLead' },
      ],
      admin: {
        description:
          'Whether to also create a HubSpot Lead alongside the Contact. Default writes a Contact only.',
      },
    },
    {
      name: 'defaultLifecycleStage',
      type: 'text',
      defaultValue: 'lead',
      admin: {
        description: 'HubSpot lifecyclestage value. Default "lead".',
      },
    },
    {
      name: 'defaultLeadStatus',
      type: 'text',
      defaultValue: 'NEW',
      admin: {
        description: 'HubSpot hs_lead_status value. Default "NEW".',
      },
    },
    {
      name: 'fieldMapping',
      type: 'array',
      labels: { singular: 'mapping', plural: 'mappings' },
      admin: {
        description:
          'Optional — map submission field names onto HubSpot property API names. Standard mapping (email → email, name → firstname/lastname) is automatic.',
      },
      fields: [
        {
          name: 'submissionField',
          type: 'text',
          required: true,
          admin: { placeholder: 'company' },
        },
        {
          name: 'hubspotProperty',
          type: 'text',
          required: true,
          admin: { placeholder: 'company' },
        },
      ],
    },
  ],
};

const ga4ConfigGroup: Field = {
  name: 'ga4Config',
  type: 'group',
  label: 'GA4 settings',
  admin: {
    condition: kindIs('ga4DataApi'),
    description:
      'Service-account JSON is set globally via GOOGLE_APPLICATION_CREDENTIALS_JSON env. Grant the SA Viewer role on the GA4 property.',
  },
  fields: [
    {
      name: 'propertyId',
      type: 'text',
      required: true,
      admin: {
        description: 'GA4 property ID (numbers only — find it in Admin → Property Settings).',
        placeholder: '123456789',
      },
    },
  ],
};

const gscConfigGroup: Field = {
  name: 'gscConfig',
  type: 'group',
  label: 'Google Search Console settings',
  admin: {
    condition: kindIs(['gscSearchAnalyticsApi', 'gscUrlInspectionApi']),
    description:
      'Service-account JSON is set globally via GOOGLE_APPLICATION_CREDENTIALS_JSON env. Add the SA as a user (or delegated owner for Indexing API) in GSC.',
  },
  fields: [
    {
      name: 'siteUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'GSC property identifier. Domain property = "sc-domain:cleanstart.com". URL prefix = "https://cleanstart.com/" (trailing slash).',
        placeholder: 'sc-domain:cleanstart.com',
      },
    },
  ],
};

const clarityConfigGroup: Field = {
  name: 'clarityConfig',
  type: 'group',
  label: 'MS Clarity settings',
  admin: {
    condition: kindIs('msClarity'),
    description:
      'API token comes from the CLARITY_API_TOKEN env var — nothing to paste here. Generate it in Clarity → Settings → Data Export.',
  },
  fields: [
    {
      name: 'note',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/integrations/ConfigNote.tsx#ClarityConfigNote',
          },
        },
      },
    },
  ],
};

const cloudflareConfigGroup: Field = {
  name: 'cloudflareConfig',
  type: 'group',
  label: 'Cloudflare Web Analytics settings',
  admin: {
    condition: kindIs('cloudflareWebAnalytics'),
    description:
      'API token comes from the CLOUDFLARE_API_TOKEN env var. This row only specifies which Cloudflare account to read.',
  },
  fields: [
    {
      name: 'accountTag',
      type: 'text',
      admin: {
        description:
          'Cloudflare account ID (32-char hex). Optional — falls back to CLOUDFLARE_ACCOUNT_TAG env.',
        placeholder: 'abc123def456...',
      },
    },
  ],
};

const calcomConfigGroup: Field = {
  name: 'calcomConfig',
  type: 'group',
  label: 'Cal.com inbound settings',
  admin: {
    condition: kindIs('calComInbound'),
    description:
      'Cal.com posts to /api/integrations/calcom; signing secret is the CALCOM_SIGNING_SECRET env var. This row maps bookings to a lead form.',
  },
  fields: [
    {
      name: 'fallbackFormId',
      type: 'number',
      required: true,
      admin: {
        description:
          'Form ID to attribute Cal.com bookings to. Editors create a hidden "Cal.com bookings" form and paste its ID here.',
      },
    },
  ],
};

const brevoConfigGroup: Field = {
  name: 'brevoConfig',
  type: 'group',
  label: 'Brevo bounce callback settings',
  admin: {
    condition: kindIs('brevoBounceCallback'),
    description:
      'Bearer token comes from the BREVO_INBOUND_TOKEN env var. Register https://admin.cleanstart.com/api/integrations/brevo as a webhook in Brevo with that token in the auth field.',
  },
  fields: [
    {
      name: 'note',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/integrations/ConfigNote.tsx#BrevoConfigNote',
          },
        },
      },
    },
  ],
};

// ─── Collection ──────────────────────────────────────────────────

export const Integrations: CollectionConfig = {
  slug: 'integrations',
  labels: { singular: 'Integration', plural: 'Integrations' },
  admin: {
    group: 'System',
    useAsTitle: 'label',
    defaultColumns: ['label', 'kind', 'enabled', 'source', 'updatedAt'],
    description:
      'Outbound destinations and analytics read-back. Credentials (HubSpot, GA4 service account, Clarity, Cloudflare, Brevo, Cal.com) live in env vars set by ops; per-channel URLs (Teams, generic webhook) are encrypted in the row.',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  timestamps: true,
  hooks: {
    beforeChange: [encryptSecretsBeforeChange],
    afterRead: [maskSecretsAfterRead],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'Human-readable name. "Sales · #sales-eng-leads", "Zapier — lead webhook", etc.',
      },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [...ACTIVE_KIND_OPTIONS, ...RESERVED_KIND_OPTIONS],
      admin: {
        description: 'Integration type. Locked after creation.',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Pause without deleting.' },
    },
    {
      name: 'routing',
      type: 'group',
      label: 'Event routing',
      admin: {
        condition: (_, sibling) => isDispatching(sibling),
        description:
          'Which events trigger this destination. Empty filter = all collections / all forms.',
      },
      fields: [
        {
          name: 'events',
          type: 'select',
          hasMany: true,
          required: true,
          options: [
            { label: 'document.published — on first publish of a content doc', value: 'document.published' },
            { label: 'lead.submitted — on every public form submission', value: 'lead.submitted' },
          ],
        },
        {
          name: 'collections',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'Filter document.published events by collection slug (e.g. "blogs", "news"). Empty = all.',
          },
        },
        {
          name: 'formSlugs',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'Filter lead.submitted events by form slug (e.g. "demo-request"). Empty = all forms.',
          },
        },
      ],
    },
    teamsConfigGroup,
    genericConfigGroup,
    hubspotConfigGroup,
    ga4ConfigGroup,
    gscConfigGroup,
    clarityConfigGroup,
    cloudflareConfigGroup,
    calcomConfigGroup,
    brevoConfigGroup,
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
        position: 'sidebar',
        description: 'DB-backed rows = editable. Legacy (env) rows are read-only.',
      },
    },
    {
      name: 'lastHealthAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: { displayFormat: 'PPpp' },
        description: 'When the health badge last polled.',
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
        condition: (_, sibling) => isDispatching(sibling),
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
        condition: (_, sibling) => isDispatching(sibling),
        components: {
          Field: {
            path: '@/payload/admin/components/integrations/AuditTrail.tsx#AuditTrail',
          },
        },
      },
    },
  ],
};

export { ACTIVE_KIND_OPTIONS, RESERVED_KIND_OPTIONS, DISPATCHING_KINDS };
