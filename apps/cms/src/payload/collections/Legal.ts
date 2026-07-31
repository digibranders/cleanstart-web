import type { CollectionConfig } from 'payload';

import { isAdminEditorOrLegal, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { firstPublishHook } from '../hooks/first-publish';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { searchSyncAfterChangeHook, searchSyncAfterDeleteHook } from '../hooks/search-sync';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

/**
 * Allowed sidebar icon keys. MUST stay in sync with the `LEGAL_ICONS` map in
 * `apps/web/src/components/sections/legal/legalIcons.ts` (a CMS↔web parity test
 * guards this). Icons are React components, so the CMS stores the key string
 * and the web layer resolves it to a `lucide-react` component.
 */
export const LEGAL_ICON_OPTIONS = [
  'FileText',
  'FileLock2',
  'ScrollText',
  'BadgeCheck',
  'FileCheck2',
  'Stamp',
  'Bug',
  'Scale',
  'FileSignature',
  'ShieldCheck',
] as const;

// NOTE: slug is `legalDocuments`, NOT `legal` — the `legal` slug is already
// taken by the GDPR-critical `Legal` global (globals/legal.ts, policyVersion
// snapshotted onto leads). Public URLs are still `/legal/<slug>` via ROUTE_PREFIX.
export const LegalDocuments: CollectionConfig = {
  slug: 'legalDocuments',
  labels: { singular: 'Legal Document', plural: 'Legal Documents' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'effectiveDate', '_status', 'updatedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true, showPurge: true }),
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: isAdminEditorOrLegal,
    update: isAdminEditorOrLegal,
    delete: isAdminEditorOrLegal,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 99,
      admin: {
        position: 'sidebar',
        step: 1,
        description: 'Sidebar position (ascending). Lowest order is the /legal landing document.',
      },
    },
    {
      name: 'icon',
      type: 'select',
      required: true,
      defaultValue: 'FileText',
      options: LEGAL_ICON_OPTIONS.map((value) => ({ label: value, value })),
      admin: {
        position: 'sidebar',
        description: 'Sidebar icon. Must match a key in the web LEGAL_ICONS map.',
      },
    },
    {
      name: 'effectiveDate',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'MMMM d, yyyy' },
        description:
          'The date these terms take legal effect. Shown publicly as the “Effective” date.',
      },
    },
    { name: 'body', type: 'richText' },
    {
      name: 'lastReviewedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'MMMM d, yyyy' },
        description: 'Internal: date of the most recent legal review. Not shown publicly.',
      },
    },
    {
      name: 'changeSummary',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Internal: short summary of what changed in this revision (audit trail).',
      },
    },
    publishedAtField,
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: '/legal', descriptionSource: 'title' }),
  ],
  hooks: {
    beforeChange: [normalizeLexicalHook(), firstPublishHook(), displayPublishedAtBackfillHook],
    afterChange: [
      slugChangeRedirectHook('legalDocuments'),
      displayPublishedAtAuditHook('legalDocuments'),
      searchSyncAfterChangeHook('legalDocuments'),
      webhooksPublishAfterChangeHook('legalDocuments'),
      indexNowPublishAfterChangeHook('legalDocuments'),
      revalidateWebPublishAfterChangeHook('legalDocuments'),
    ],
    afterDelete: [
      searchSyncAfterDeleteHook('legalDocuments'),
      revalidateWebAfterDeleteHook('legalDocuments'),
    ],
  },
  // No `maxPerDoc` cap: legal documents retain their full amendment history
  // for compliance/audit. Schedule-publish is enabled for dated effective terms.
  versions: { drafts: { schedulePublish: true } },
};
