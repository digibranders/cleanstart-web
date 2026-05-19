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
 * the droplet `.env`, and the handler reads them at run time via
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
      'Sends notifications to a Teams channel. Each row connects to one channel — you can add multiple rows for multiple channels.',
  },
  fields: [
    {
      name: 'webhookUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'The webhook URL for your Teams channel. In Teams, open the channel → Workflows → "Post to a channel when a webhook request is received" to generate this URL. Saved securely — leave blank to keep the existing value.',
        placeholder: 'https://prod-XX.westus.logic.azure.com/workflows/...',
      },
    },
    {
      name: 'mentions',
      type: 'array',
      labels: { singular: 'mention', plural: 'mentions' },
      admin: {
        description:
          'Optional — tag specific team members in notifications. Ask your IT admin for each person\'s User ID and email address from Microsoft Entra (Azure AD).',
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
            description: 'Optional — only mention this person for specific event types. Leave empty to mention them on all notifications.',
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
      'Sends event data to an external automation tool like Zapier, Make, or n8n whenever something happens on the site.',
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'The destination URL provided by your automation tool. Saved securely.',
        placeholder: 'https://hooks.zapier.com/...',
      },
    },
    {
      name: 'signingSecret',
      type: 'text',
      required: true,
      admin: {
        description:
          'A secret passphrase used to verify that notifications genuinely came from CleanStart. Saved securely — leave blank to keep the existing value.',
      },
    },
    {
      name: 'signingKeyId',
      type: 'text',
      admin: {
        description: 'Optional label for this secret key — useful if you rotate secrets and want to track which key is active.',
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
      'Your HubSpot connection is already set up by the technical team. Use the options below to control how new form submissions appear in HubSpot.',
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
          'Choose whether to create just a Contact in HubSpot, or a Contact and a Lead record together.',
      },
    },
    {
      name: 'defaultLifecycleStage',
      type: 'select',
      defaultValue: 'lead',
      options: [
        { label: 'Subscriber', value: 'subscriber' },
        { label: 'Lead', value: 'lead' },
        { label: 'Marketing Qualified Lead', value: 'marketingqualifiedlead' },
        { label: 'Sales Qualified Lead', value: 'salesqualifiedlead' },
        { label: 'Opportunity', value: 'opportunity' },
        { label: 'Customer', value: 'customer' },
        { label: 'Evangelist', value: 'evangelist' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Where new contacts will be placed in your HubSpot pipeline.',
      },
    },
    {
      name: 'defaultLeadStatus',
      type: 'select',
      defaultValue: 'NEW',
      options: [
        { label: 'New', value: 'NEW' },
        { label: 'Open', value: 'OPEN' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Open Deal', value: 'OPEN_DEAL' },
        { label: 'Unqualified', value: 'UNQUALIFIED' },
        { label: 'Attempted to Contact', value: 'ATTEMPTED_TO_CONTACT' },
        { label: 'Connected', value: 'CONNECTED' },
        { label: 'Bad Timing', value: 'BAD_TIMING' },
      ],
      admin: {
        description: 'The initial follow-up status applied to new contacts in HubSpot.',
      },
    },
    {
      name: 'fieldMapping',
      type: 'array',
      labels: { singular: 'mapping', plural: 'mappings' },
      admin: {
        description:
          'Optional — if your form has custom fields, map them to the matching HubSpot property here. Email and name are mapped automatically.',
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
  label: 'Google Analytics 4 settings',
  admin: {
    condition: kindIs('ga4DataApi'),
    description:
      'Pulls your website traffic data into the dashboard. The connection credentials are already set up by the technical team — just enter your Property ID below.',
  },
  fields: [
    {
      name: 'propertyId',
      type: 'text',
      required: true,
      admin: {
        description: 'Your GA4 Property ID — a number you can find in Google Analytics under Admin → Property Settings.',
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
      'Pulls search performance data (clicks, impressions) from Google. The connection credentials are already set up by the technical team — just enter your site address below.',
  },
  fields: [
    {
      name: 'siteUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'Your site as it appears in Google Search Console. Use "sc-domain:cleanstart.com" for a domain property, or "https://cleanstart.com/" (with trailing slash) for a URL-prefix property.',
        placeholder: 'sc-domain:cleanstart.com',
      },
    },
  ],
};

const clarityConfigGroup: Field = {
  name: 'clarityConfig',
  type: 'group',
  label: 'Microsoft Clarity settings',
  admin: {
    condition: kindIs('msClarity'),
    description:
      'Shows which pages have the most user friction (rage clicks, dead clicks). Everything is already set up by the technical team — no extra configuration needed here.',
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
      'Shows pageview and visitor data from Cloudflare. The connection is already set up by the technical team. The field below is optional — only fill it in if you have multiple Cloudflare accounts.',
  },
  fields: [
    {
      name: 'accountTag',
      type: 'text',
      admin: {
        description:
          'Optional — your Cloudflare Account ID. Leave blank to use the default account already configured by the technical team.',
        placeholder: 'abc123def456...',
      },
    },
  ],
};

const calcomConfigGroup: Field = {
  name: 'calcomConfig',
  type: 'group',
  label: 'Cal.com settings',
  admin: {
    condition: kindIs('calComInbound'),
    description:
      'Automatically creates a lead record whenever someone books a meeting via Cal.com. The security connection is already set up by the technical team.',
  },
  fields: [
    {
      name: 'fallbackFormId',
      type: 'number',
      required: true,
      admin: {
        description:
          'The ID of the form that Cal.com bookings should be recorded under. Create a form called "Cal.com Bookings" in the Forms collection, then paste its numeric ID here.',
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
      'Keeps your email list clean by automatically marking contacts who bounced or complained. Everything is set up by the technical team — no configuration needed here.',
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
      'Connect CleanStart to your other tools — CRM, analytics, notifications, and automations. Each row is one connection. Your technical team handles credentials; you control what gets sent where.',
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
        description: 'A friendly name to identify this connection, e.g. "Sales team notifications" or "Zapier lead alerts".',
      },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [...ACTIVE_KIND_OPTIONS, ...RESERVED_KIND_OPTIONS],
      admin: {
        description: 'The type of tool you are connecting to. Cannot be changed after saving.',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Turn this connection on or off without removing it.' },
    },
    {
      name: 'routing',
      type: 'group',
      label: 'Event routing',
      admin: {
        condition: (_, sibling) => isDispatching(sibling),
        description:
          'Choose which activity on the site triggers a notification. Leave all filters empty to receive everything.',
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
          admin: {
            components: {
              Field: {
                path: '@/payload/admin/components/integrations/EventsMultiSelect.tsx#EventsMultiSelect',
              },
            },
          },
        },
        {
          name: 'collections',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Blogs', value: 'blogs' },
            { label: 'News', value: 'news' },
            { label: 'Guides', value: 'guides' },
            { label: 'Resources', value: 'resources' },
            { label: 'Knowledge Base', value: 'knowledgeBase' },
            { label: 'Events', value: 'events' },
            { label: 'Webinars', value: 'webinars' },
            { label: 'Jobs', value: 'jobs' },
            { label: 'Pages', value: 'pages' },
          ],
          admin: {
            description: 'Filter document.published events by collection. Empty = all collections.',
            components: {
              Field: {
                path: '@/payload/admin/components/integrations/CollectionsMultiSelect.tsx#CollectionsMultiSelect',
              },
            },
          },
        },
        {
          name: 'formSlugs',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'Filter lead.submitted events by form slug. Empty = all forms.',
            components: {
              Field: {
                path: '@/payload/admin/components/integrations/FormSlugsMultiSelect.tsx#FormSlugsMultiSelect',
              },
            },
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
